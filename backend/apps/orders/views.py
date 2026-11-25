from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem, MomoPayment, Order
from .serializers import (
    CartItemSerializer,
    CartSerializer,
    CheckoutSerializer,
    MomoPaySerializer,
    OrderSerializer,
    OrderStatusUpdateSerializer,
)
from .services import (
    cancel_order_by_buyer,
    checkout_cart,
    expire_unpaid_momo_orders,
    refresh_momo_payment,
    start_momo_payment,
    transition_order_status,
)


class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        return Response(CartSerializer(cart).data)


class CartItemListCreateView(generics.CreateAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        cart, _ = Cart.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data["product"]
        quantity = serializer.validated_data.get("quantity", 1)

        item, created = CartItem.objects.get_or_create(cart=cart, product=product, defaults={"quantity": quantity})
        if not created:
            item.quantity += quantity
            item.save(update_fields=["quantity"])
        return Response(CartItemSerializer(item).data, status=status.HTTP_201_CREATED)


class CartItemDetailView(generics.GenericAPIView):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return get_object_or_404(CartItem, pk=self.kwargs["pk"], cart__user=self.request.user)

    def patch(self, request, pk):
        item = self.get_object()
        quantity = request.data.get("quantity")
        if quantity is None or int(quantity) < 1:
            return Response({"quantity": "Must be at least 1."}, status=status.HTTP_400_BAD_REQUEST)
        item.quantity = int(quantity)
        item.save(update_fields=["quantity"])
        return Response(CartItemSerializer(item).data)

    def delete(self, request, pk):
        self.get_object().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class OrderViewSet(viewsets.ModelViewSet):
    http_method_names = ["get", "post", "patch", "head", "options"]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Order.objects.prefetch_related("items__product", "items__seller", "momo_payments").select_related("buyer")
        if user.is_staff:
            return qs.all()
        return qs.filter(Q(buyer=user) | Q(items__seller=user)).distinct()

    def get_serializer_class(self):
        if self.action == "create":
            return CheckoutSerializer
        return OrderSerializer

    def list(self, request, *args, **kwargs):
        expire_unpaid_momo_orders()
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        expire_unpaid_momo_orders()
        return super().retrieve(request, *args, **kwargs)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        """Let the buyer cancel an order the seller hasn't confirmed and that isn't paid."""
        order = cancel_order_by_buyer(self.get_object(), request.user)
        return Response(OrderSerializer(order).data)

    def create(self, request, *args, **kwargs):
        serializer = CheckoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = checkout_cart(request.user, **serializer.validated_data)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["patch"])
    def status(self, request, pk=None):
        order = self.get_object()
        is_item_seller = order.items.filter(seller=request.user).exists()
        if not (is_item_seller or request.user.is_staff):
            return Response({"detail": "Only the seller can update order status."}, status=status.HTTP_403_FORBIDDEN)
        serializer = OrderStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if (
            serializer.validated_data.get("payment_status")
            and order.payment_method == Order.PaymentMethod.MOMO
            and not request.user.is_staff
        ):
            return Response(
                {"detail": "MTN Mobile Money payments are confirmed automatically by MTN."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        order = transition_order_status(
            order,
            new_status=serializer.validated_data.get("status"),
            new_payment_status=serializer.validated_data.get("payment_status"),
        )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], url_path="momo/pay")
    def momo_pay(self, request, pk=None):
        """Send an MTN MoMo payment prompt to the buyer's phone."""
        order = self.get_object()
        if order.buyer_id != request.user.id:
            return Response({"detail": "Only the buyer can pay for this order."}, status=status.HTTP_403_FORBIDDEN)
        serializer = MomoPaySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        start_momo_payment(order, serializer.validated_data["phone"])
        order.refresh_from_db()
        return Response(OrderSerializer(order).data, status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=["get"], url_path="momo/status")
    def momo_status(self, request, pk=None):
        """Check with MTN whether the latest MoMo payment has been approved."""
        order = self.get_object()
        latest = order.momo_payments.first()
        if latest and latest.status == MomoPayment.Status.PENDING:
            refresh_momo_payment(latest)
            order.refresh_from_db()
        return Response(OrderSerializer(order).data)


class MomoConfigView(APIView):
    """Tells the checkout page whether MoMo is switched on (no secrets returned)."""

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.conf import settings

        from . import momo

        return Response({
            "enabled": momo.is_configured(),
            "sandbox": settings.MOMO_TARGET_ENVIRONMENT == "sandbox",
            "currency": settings.MOMO_CURRENCY,
        })


class MomoCallbackView(APIView):
    """Endpoint MTN calls when a payment finishes.

    It is public, so the request body is never trusted: we only use it to find
    the order, then ask MTN directly for the real status of its pending payments.
    """

    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        external_id = str(request.data.get("externalId", "")) if hasattr(request.data, "get") else ""
        prefix = "reloop-order-"
        if external_id.startswith(prefix) and external_id[len(prefix):].isdigit():
            pending = MomoPayment.objects.filter(
                order_id=int(external_id[len(prefix):]), status=MomoPayment.Status.PENDING
            )
            for payment in pending:
                refresh_momo_payment(payment)
        return Response(status=status.HTTP_200_OK)

    put = post
