from rest_framework import serializers

from apps.products.models import Product
from apps.products.serializers import ProductListSerializer

from .models import DonationRequest


class DonationRequestSerializer(serializers.ModelSerializer):
    product_detail = ProductListSerializer(source="product", read_only=True)
    requester_name = serializers.CharField(source="requester.full_name", read_only=True)

    class Meta:
        model = DonationRequest
        fields = [
            "id", "product", "product_detail", "requester", "requester_name",
            "message", "status", "created_at", "updated_at",
        ]
        read_only_fields = ["requester", "status"]

    def validate_product(self, product):
        if product.transaction_type != Product.TransactionType.FREE_DONATION:
            raise serializers.ValidationError("This product is not listed as a donation.")
        if product.status != Product.Status.ACTIVE:
            raise serializers.ValidationError("This donation is no longer available.")
        request = self.context["request"]
        if product.seller_id == request.user.id:
            raise serializers.ValidationError("You cannot request your own donation.")
        return product


class DonationStatusUpdateSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["accept", "reject", "complete"])
