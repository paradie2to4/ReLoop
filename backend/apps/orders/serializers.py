from rest_framework import serializers

from apps.products.models import Product
from apps.products.serializers import ProductListSerializer

from .models import Cart, CartItem, MomoPayment, Order, OrderItem


class CartItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.filter(status=Product.Status.ACTIVE), source="product", write_only=True
    )
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = CartItem
        fields = ["id", "product", "product_id", "quantity", "subtotal", "created_at"]

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Cart
        fields = ["id", "items", "total", "updated_at"]


class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductListSerializer(read_only=True)
    seller_name = serializers.CharField(source="seller.full_name", read_only=True)
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "seller", "seller_name", "quantity", "price", "subtotal"]


class MomoPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MomoPayment
        fields = ["id", "reference_id", "phone", "amount", "currency", "status", "failure_reason", "created_at", "updated_at"]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    buyer_name = serializers.CharField(source="buyer.full_name", read_only=True)
    momo_payment = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "buyer", "buyer_name", "status", "payment_method", "payment_status",
            "total_amount", "shipping_location", "notes", "items", "momo_payment", "created_at", "updated_at",
        ]
        read_only_fields = ["buyer", "status", "payment_status", "total_amount"]

    def get_momo_payment(self, order):
        """The latest MoMo attempt, so the order page can show its progress."""
        if order.payment_method != Order.PaymentMethod.MOMO:
            return None
        latest = order.momo_payments.first()
        return MomoPaymentSerializer(latest).data if latest else None


class MomoPaySerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=20)


class CheckoutSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices)
    shipping_location = serializers.CharField(max_length=200)
    notes = serializers.CharField(max_length=255, required=False, allow_blank=True)

    def validate_payment_method(self, value):
        from . import momo

        if value == Order.PaymentMethod.MOMO and not momo.is_configured():
            raise serializers.ValidationError("MTN Mobile Money is not available right now.")
        return value


class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices, required=False)
    payment_status = serializers.ChoiceField(choices=Order.PaymentStatus.choices, required=False)
