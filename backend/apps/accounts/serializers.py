from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import User


def absolute_url(request, file_field):
    """Local media storage returns a relative /media/... URL; Cloudinary
    already returns an absolute URL. build_absolute_uri() is a no-op for
    URLs that are already absolute, so this is safe for both backends."""
    if not file_field:
        return None
    url = file_field.url
    return request.build_absolute_uri(url) if request else url


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "full_name", "email", "password", "password2", "location"]

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password2"):
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Adds basic user info to the token response so the frontend doesn't
    need a second round-trip right after login."""

    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user, context=self.context).data
        return data


class UserStatsMixin:
    def get_stats(self, obj):
        # Late imports to avoid circular dependencies between apps.
        from apps.impact.models import ImpactRecord
        from apps.orders.models import OrderItem
        from apps.reviews.models import Review

        items_sold = OrderItem.objects.filter(
            seller=obj, order__status="COMPLETED"
        ).count()
        items_donated = ImpactRecord.objects.filter(user=obj, transaction_type="DONATION").count()
        items_exchanged = ImpactRecord.objects.filter(user=obj, transaction_type="EXCHANGE").count()
        reviews = Review.objects.filter(seller=obj)
        avg_rating = (
            round(sum(r.rating for r in reviews) / reviews.count(), 2) if reviews.exists() else None
        )
        return {
            "items_sold": items_sold,
            "items_donated": items_donated,
            "items_exchanged": items_exchanged,
            "review_count": reviews.count(),
            "rating": avg_rating,
        }


class UserSerializer(UserStatsMixin, serializers.ModelSerializer):
    stats = serializers.SerializerMethodField()
    role = serializers.ReadOnlyField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "phone", "location", "bio", "avatar",
            "is_seller", "role", "date_joined", "stats",
        ]
        read_only_fields = ["id", "email", "date_joined", "role"]

    def get_avatar(self, obj):
        return absolute_url(self.context.get("request"), obj.avatar)


class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["full_name", "phone", "location", "bio", "avatar"]


class PublicSellerSerializer(UserStatsMixin, serializers.ModelSerializer):
    stats = serializers.SerializerMethodField()
    avatar = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "full_name", "location", "avatar", "date_joined", "stats"]

    def get_avatar(self, obj):
        return absolute_url(self.context.get("request"), obj.avatar)


class AdminUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id", "email", "full_name", "location", "is_seller", "is_active",
            "is_staff", "date_joined",
        ]
        read_only_fields = ["id", "email", "date_joined"]
