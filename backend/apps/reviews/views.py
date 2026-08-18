from rest_framework import permissions, viewsets

from apps.notifications.services import notify

from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    http_method_names = ["get", "post", "head", "options"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = Review.objects.select_related("reviewer", "seller", "order")
        seller_id = self.request.query_params.get("seller")
        if seller_id:
            qs = qs.filter(seller_id=seller_id)
        return qs

    def perform_create(self, serializer):
        order = serializer.validated_data["order"]
        seller = order.items.select_related("seller").first().seller
        review = serializer.save(reviewer=self.request.user, seller=seller)
        notify(seller, "New review received", f"You received a {review.rating}-star review.", "REVIEW")
