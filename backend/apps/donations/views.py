from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.notifications.services import notify
from apps.products.models import Product

from .models import DonationRequest
from .serializers import DonationRequestSerializer, DonationStatusUpdateSerializer


class DonationRequestViewSet(viewsets.ModelViewSet):
    serializer_class = DonationRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        return (
            DonationRequest.objects.filter(Q(requester=user) | Q(product__seller=user))
            .select_related("product", "requester", "product__seller")
        )

    def perform_create(self, serializer):
        donation = serializer.save(requester=self.request.user)
        notify(
            donation.product.seller,
            "New donation request",
            f"{donation.requester.full_name} would like to receive your donated '{donation.product.title}'.",
            "DONATION_REQUEST",
        )

    @action(detail=True, methods=["patch"])
    def respond(self, request, pk=None):
        donation = self.get_object()
        product = donation.product
        serializer = DonationStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        act = serializer.validated_data["action"]

        is_donor = product.seller_id == request.user.id
        if act in ("accept", "reject") and not is_donor:
            return Response({"detail": "Only the donor can respond to this request."}, status=status.HTTP_403_FORBIDDEN)
        if act == "complete" and request.user.id not in (product.seller_id, donation.requester_id):
            return Response({"detail": "Only participants can complete this donation."}, status=status.HTTP_403_FORBIDDEN)

        if act == "accept":
            if donation.status != DonationRequest.Status.PENDING:
                return Response({"detail": "This request is no longer pending."}, status=status.HTTP_400_BAD_REQUEST)
            donation.status = DonationRequest.Status.ACCEPTED
            donation.save(update_fields=["status"])
            product.status = Product.Status.RESERVED
            product.save(update_fields=["status"])
            DonationRequest.objects.filter(product=product, status=DonationRequest.Status.PENDING).exclude(
                pk=donation.pk
            ).update(status=DonationRequest.Status.REJECTED)
            notify(donation.requester, "Donation accepted", f"Your request for '{product.title}' was accepted.", "DONATION_ACCEPTED")

        elif act == "reject":
            donation.status = DonationRequest.Status.REJECTED
            donation.save(update_fields=["status"])

        elif act == "complete":
            if donation.status != DonationRequest.Status.ACCEPTED:
                return Response({"detail": "Donation must be accepted before it can be completed."}, status=status.HTTP_400_BAD_REQUEST)
            from apps.impact.services import ImpactCalculationService

            donation.status = DonationRequest.Status.COMPLETED
            donation.save(update_fields=["status"])
            product.status = Product.Status.DONATED
            product.save(update_fields=["status"])
            ImpactCalculationService.record(product.seller, product, "DONATION")
            ImpactCalculationService.record(donation.requester, product, "DONATION")

        return Response(DonationRequestSerializer(donation, context={"request": request}).data)
