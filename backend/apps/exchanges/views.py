from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.notifications.services import notify
from apps.products.models import Product

from .models import ExchangeRequest
from .serializers import ExchangeRequestSerializer, ExchangeStatusUpdateSerializer


class ExchangeRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ExchangeRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        return (
            ExchangeRequest.objects.filter(Q(sender=user) | Q(receiver=user))
            .select_related("sender", "receiver", "offered_product", "requested_product")
        )

    def perform_create(self, serializer):
        requested_product = serializer.validated_data["requested_product"]
        exchange = serializer.save(sender=self.request.user, receiver=requested_product.seller)
        notify(
            exchange.receiver,
            "New exchange offer",
            f"{exchange.sender.full_name} wants to exchange for your '{exchange.requested_product.title}'.",
            "EXCHANGE_REQUEST",
        )

    @action(detail=True, methods=["patch"])
    def respond(self, request, pk=None):
        exchange = self.get_object()
        serializer = ExchangeStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        act = serializer.validated_data["action"]

        if act in ("accept", "reject") and request.user != exchange.receiver:
            return Response({"detail": "Only the receiver can respond to this request."}, status=status.HTTP_403_FORBIDDEN)
        if act == "cancel" and request.user != exchange.sender:
            return Response({"detail": "Only the sender can cancel this request."}, status=status.HTTP_403_FORBIDDEN)
        if act == "complete" and request.user not in (exchange.sender, exchange.receiver):
            return Response({"detail": "Only participants can complete this exchange."}, status=status.HTTP_403_FORBIDDEN)

        if act == "accept":
            if exchange.status != ExchangeRequest.Status.PENDING:
                return Response({"detail": "This request is no longer pending."}, status=status.HTTP_400_BAD_REQUEST)
            exchange.status = ExchangeRequest.Status.ACCEPTED
            exchange.save(update_fields=["status"])
            Product.objects.filter(id__in=[exchange.offered_product_id, exchange.requested_product_id]).update(
                status=Product.Status.RESERVED
            )
            notify(exchange.sender, "Exchange accepted", "Your exchange offer was accepted.", "EXCHANGE_ACCEPTED")

        elif act == "reject":
            exchange.status = ExchangeRequest.Status.REJECTED
            exchange.save(update_fields=["status"])
            notify(exchange.sender, "Exchange rejected", "Your exchange offer was rejected.", "EXCHANGE_REJECTED")

        elif act == "cancel":
            exchange.status = ExchangeRequest.Status.CANCELLED
            exchange.save(update_fields=["status"])

        elif act == "complete":
            if exchange.status != ExchangeRequest.Status.ACCEPTED:
                return Response({"detail": "Exchange must be accepted before it can be completed."}, status=status.HTTP_400_BAD_REQUEST)
            from apps.impact.services import ImpactCalculationService

            exchange.status = ExchangeRequest.Status.COMPLETED
            exchange.save(update_fields=["status"])
            offered, requested = exchange.offered_product, exchange.requested_product
            offered.status = Product.Status.EXCHANGED
            requested.status = Product.Status.EXCHANGED
            offered.save(update_fields=["status"])
            requested.save(update_fields=["status"])
            ImpactCalculationService.record(exchange.sender, offered, "EXCHANGE")
            ImpactCalculationService.record(exchange.receiver, requested, "EXCHANGE")

        return Response(ExchangeRequestSerializer(exchange, context={"request": request}).data)
