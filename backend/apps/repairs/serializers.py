from rest_framework import serializers

from .models import RepairProvider, RepairRequest


def absolute_url(request, file_field):
    """Local media storage returns a relative /media/... URL; Cloudinary
    already returns an absolute URL. build_absolute_uri() is a no-op for
    URLs that are already absolute, so this is safe for both backends."""
    if not file_field:
        return None
    url = file_field.url
    return request.build_absolute_uri(url) if request else url


class RepairProviderSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = RepairProvider
        fields = [
            "id", "name", "description", "specialization", "location",
            "phone", "email", "rating", "image", "is_active",
        ]

    def get_image(self, obj):
        return absolute_url(self.context.get("request"), obj.image)


class RepairRequestSerializer(serializers.ModelSerializer):
    provider_name = serializers.CharField(source="repair_provider.name", read_only=True)
    product_title = serializers.CharField(source="product.title", read_only=True, default="")

    class Meta:
        model = RepairRequest
        fields = [
            "id", "user", "product", "product_title", "repair_provider", "provider_name",
            "problem_description", "status", "estimated_cost", "created_at", "updated_at",
        ]
        read_only_fields = ["user", "status", "estimated_cost"]


class AdminRepairRequestUpdateSerializer(RepairRequestSerializer):
    class Meta(RepairRequestSerializer.Meta):
        read_only_fields = ["user"]
