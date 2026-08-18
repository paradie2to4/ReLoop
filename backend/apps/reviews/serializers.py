from rest_framework import serializers

from apps.orders.models import Order

from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    reviewer_name = serializers.CharField(source="reviewer.full_name", read_only=True)
    seller_name = serializers.CharField(source="seller.full_name", read_only=True)
    order_id = serializers.PrimaryKeyRelatedField(queryset=Order.objects.all(), source="order")

    class Meta:
        model = Review
        fields = ["id", "reviewer", "reviewer_name", "seller", "seller_name", "order_id", "rating", "comment", "created_at"]
        read_only_fields = ["reviewer", "seller"]

    def validate_order_id(self, order):
        request = self.context["request"]
        if order.buyer_id != request.user.id:
            raise serializers.ValidationError("You can only review your own orders.")
        if order.status != Order.Status.COMPLETED:
            raise serializers.ValidationError("You can only review completed orders.")
        if hasattr(order, "review"):
            raise serializers.ValidationError("You already reviewed this order.")
        return order
