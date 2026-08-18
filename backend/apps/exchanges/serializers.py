from rest_framework import serializers

from apps.products.models import Product
from apps.products.serializers import ProductListSerializer

from .models import ExchangeRequest


class ExchangeRequestSerializer(serializers.ModelSerializer):
    offered_product_detail = ProductListSerializer(source="offered_product", read_only=True)
    requested_product_detail = ProductListSerializer(source="requested_product", read_only=True)
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)
    receiver_name = serializers.CharField(source="receiver.full_name", read_only=True)

    class Meta:
        model = ExchangeRequest
        fields = [
            "id", "sender", "sender_name", "receiver", "receiver_name",
            "offered_product", "offered_product_detail", "requested_product", "requested_product_detail",
            "additional_cash", "message", "status", "created_at", "updated_at",
        ]
        read_only_fields = ["sender", "receiver", "status"]

    def validate(self, attrs):
        request = self.context["request"]
        offered_product = attrs["offered_product"]
        requested_product = attrs["requested_product"]

        if offered_product.seller_id != request.user.id:
            raise serializers.ValidationError({"offered_product": "You can only offer your own product."})
        if requested_product.seller_id == request.user.id:
            raise serializers.ValidationError({"requested_product": "You cannot request your own product."})
        if offered_product.status != Product.Status.ACTIVE:
            raise serializers.ValidationError({"offered_product": "This product is not available."})
        if requested_product.status != Product.Status.ACTIVE:
            raise serializers.ValidationError({"requested_product": "This product is not available."})
        if not requested_product.allows_exchange:
            raise serializers.ValidationError({"requested_product": "This product is not open to exchange offers."})
        return attrs


class ExchangeStatusUpdateSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=["accept", "reject", "cancel", "complete"])
