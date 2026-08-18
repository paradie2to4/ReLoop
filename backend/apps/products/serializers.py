from django.conf import settings
from rest_framework import serializers

from .models import Category, Product, ProductImage, Wishlist, WishlistItem


def absolute_url(request, file_field):
    """Local media storage returns a relative /media/... URL; Cloudinary
    already returns an absolute URL. build_absolute_uri() is a no-op for
    URLs that are already absolute, so this is safe for both backends."""
    if not file_field:
        return None
    url = file_field.url
    return request.build_absolute_uri(url) if request else url


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True, required=False)

    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description", "icon", "product_count"]
        read_only_fields = ["slug"]


class ProductImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image", "url", "is_primary", "order"]
        extra_kwargs = {"image": {"write_only": True}}

    def get_url(self, obj):
        return absolute_url(self.context.get("request"), obj.image)

    def validate_image(self, value):
        max_bytes = settings.MAX_IMAGE_SIZE_MB * 1024 * 1024
        if hasattr(value, "size") and value.size > max_bytes:
            raise serializers.ValidationError(f"Image must be smaller than {settings.MAX_IMAGE_SIZE_MB}MB.")
        content_type = getattr(value, "content_type", None)
        if content_type and content_type not in settings.ALLOWED_IMAGE_TYPES:
            raise serializers.ValidationError("Only JPEG, PNG or WEBP images are allowed.")
        return value


class SellerMiniSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    full_name = serializers.CharField()
    location = serializers.CharField()
    avatar = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        return absolute_url(self.context.get("request"), getattr(obj, "avatar", None))


class ProductListSerializer(serializers.ModelSerializer):
    seller = SellerMiniSerializer(read_only=True)
    category = serializers.CharField(source="category.name", read_only=True)
    category_slug = serializers.CharField(source="category.slug", read_only=True)
    primary_image = serializers.SerializerMethodField()
    is_wishlisted = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id", "title", "price", "condition", "transaction_type", "status",
            "location", "seller", "category", "category_slug", "primary_image",
            "views_count", "is_featured", "created_at", "is_wishlisted",
        ]

    def get_primary_image(self, obj):
        images = list(obj.images.all())
        if not images:
            return None
        primary = next((i for i in images if i.is_primary), images[0])
        return absolute_url(self.context.get("request"), primary.image)

    def get_is_wishlisted(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        wishlisted_ids = self.context.get("wishlisted_ids")
        if wishlisted_ids is not None:
            return obj.id in wishlisted_ids
        return WishlistItem.objects.filter(wishlist__user=request.user, product=obj).exists()


class ProductDetailSerializer(ProductListSerializer):
    description = serializers.CharField()
    images = ProductImageSerializer(many=True, read_only=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + [
            "description", "images", "latitude", "longitude", "quantity", "updated_at",
        ]


class ProductWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            "id", "title", "description", "category", "transaction_type", "price",
            "condition", "location", "latitude", "longitude", "quantity", "status",
        ]

    def validate(self, attrs):
        transaction_type = attrs.get("transaction_type", getattr(self.instance, "transaction_type", None))
        price = attrs.get("price", getattr(self.instance, "price", None))
        if transaction_type == Product.TransactionType.FREE_DONATION:
            attrs["price"] = 0
        elif transaction_type in (Product.TransactionType.FOR_SALE, Product.TransactionType.SALE_OR_EXCHANGE):
            if not price or price <= 0:
                raise serializers.ValidationError({"price": "Price must be greater than 0 for this transaction type."})
        return attrs


class WishlistItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", write_only=True
    )

    class Meta:
        model = WishlistItem
        fields = ["id", "product", "product_id", "created_at"]
