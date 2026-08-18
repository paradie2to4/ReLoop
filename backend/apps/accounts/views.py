from datetime import timedelta

from django.utils import timezone
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .permissions import IsAdmin
from .serializers import (
    AdminUserSerializer,
    CustomTokenObtainPairSerializer,
    PublicSellerSerializer,
    RegisterSerializer,
    UpdateProfileSerializer,
    UserSerializer,
)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token_serializer = CustomTokenObtainPairSerializer.get_token(user)
        return Response(
            {
                "user": UserSerializer(user, context={"request": request}).data,
                "access": str(token_serializer.access_token),
                "refresh": str(token_serializer),
            },
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ("PUT", "PATCH"):
            return UpdateProfileSerializer
        return UserSerializer


class BecomeSellerView(generics.GenericAPIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        request.user.is_seller = True
        request.user.save(update_fields=["is_seller"])
        return Response(UserSerializer(request.user, context={"request": request}).data)


class PublicSellerProfileView(generics.RetrieveAPIView):
    queryset = User.objects.filter(is_active=True)
    serializer_class = PublicSellerSerializer
    permission_classes = [permissions.AllowAny]


class AdminUserViewSet(viewsets.ModelViewSet):
    """Admin-only user management: list, suspend, reactivate."""

    queryset = User.objects.all().order_by("-date_joined")
    serializer_class = AdminUserSerializer
    permission_classes = [IsAdmin]
    filterset_fields = ["is_active", "is_seller", "is_staff"]
    search_fields = ["email", "full_name"]

    @action(detail=True, methods=["post"])
    def suspend(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=["is_active"])
        return Response(AdminUserSerializer(user).data)

    @action(detail=True, methods=["post"])
    def reactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = True
        user.save(update_fields=["is_active"])
        return Response(AdminUserSerializer(user).data)


class AdminAnalyticsView(APIView):
    """Aggregate platform-wide numbers for the admin dashboard."""

    permission_classes = [IsAdmin]

    def get(self, request):
        from apps.impact.models import ImpactRecord
        from apps.orders.models import Order
        from apps.products.models import Product
        from apps.reports.models import Report

        week_ago = timezone.now() - timedelta(days=7)

        from django.db.models import Sum

        users_qs = User.objects.all()
        products_qs = Product.objects.all()
        orders_qs = Order.objects.all()

        impact_agg = ImpactRecord.objects.aggregate(
            weight=Sum("estimated_weight_saved"), co2=Sum("estimated_co2_saved")
        )

        data = {
            "users": {
                "total": users_qs.count(),
                "new_this_week": users_qs.filter(date_joined__gte=week_ago).count(),
                "active": users_qs.filter(is_active=True).count(),
                "sellers": users_qs.filter(is_seller=True).count(),
            },
            "marketplace": {
                "total_listings": products_qs.count(),
                "active_listings": products_qs.filter(status=Product.Status.ACTIVE).count(),
                "sold": products_qs.filter(status=Product.Status.SOLD).count(),
                "donated": products_qs.filter(status=Product.Status.DONATED).count(),
                "exchanged": products_qs.filter(status=Product.Status.EXCHANGED).count(),
            },
            "transactions": {
                "orders": orders_qs.count(),
                "completed": orders_qs.filter(status=Order.Status.COMPLETED).count(),
                "cancelled": orders_qs.filter(status=Order.Status.CANCELLED).count(),
            },
            "sustainability": {
                "items_reused": ImpactRecord.objects.count(),
                "estimated_weight_saved_kg": impact_agg["weight"] or 0,
                "estimated_co2_saved_kg": impact_agg["co2"] or 0,
            },
            "reports": {
                "pending": Report.objects.filter(status=Report.Status.PENDING).count(),
                "resolved": Report.objects.filter(status=Report.Status.RESOLVED).count(),
            },
        }
        return Response(data)
