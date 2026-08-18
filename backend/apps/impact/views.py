from django.db.models import Q, Sum
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import ImpactRecord
from .serializers import ImpactDashboardSerializer


class ImpactDashboardView(APIView):
    """A user's estimated environmental impact across all completed
    circular-economy transactions (sales, donations, exchanges)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from apps.exchanges.models import ExchangeRequest
        from apps.orders.models import OrderItem
        from apps.products.models import Product

        user = request.user

        items_sold = OrderItem.objects.filter(seller=user, order__status="COMPLETED").count()
        items_donated = Product.objects.filter(seller=user, status=Product.Status.DONATED).count()
        items_exchanged = ExchangeRequest.objects.filter(
            Q(sender=user) | Q(receiver=user), status="COMPLETED"
        ).count()

        totals = ImpactRecord.objects.filter(user=user).aggregate(
            weight=Sum("estimated_weight_saved"), co2=Sum("estimated_co2_saved")
        )

        data = {
            "items_reused": ImpactRecord.objects.filter(user=user).count(),
            "items_sold": items_sold,
            "items_donated": items_donated,
            "items_exchanged": items_exchanged,
            "estimated_weight_saved_kg": totals["weight"] or 0,
            "estimated_co2_saved_kg": totals["co2"] or 0,
            "recent_records": ImpactRecord.objects.filter(user=user).select_related("product")[:10],
        }
        return Response(ImpactDashboardSerializer(data).data)
