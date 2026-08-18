from django.db.models import Count, F
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsOwnerOrReadOnly, IsSeller

from .filters import ProductFilter
from .models import Category, Product, ProductImage, Wishlist, WishlistItem
from .serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductImageSerializer,
    ProductListSerializer,
    ProductWriteSerializer,
    WishlistItemSerializer,
)
from .services import get_exchange_recommendations

HOME_SECTION_LIMIT = 8


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.annotate(product_count=Count("products")).all()
    serializer_class = CategorySerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [permissions.IsAdminUser()]


class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [IsSeller, IsOwnerOrReadOnly]
    filterset_class = ProductFilter
    search_fields = ["title", "description"]
    ordering_fields = ["created_at", "price", "views_count"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Product.objects.select_related("seller", "category").prefetch_related("images")
        user = self.request.user
        mine = self.request.query_params.get("mine")
        if mine and user.is_authenticated:
            return qs.filter(seller=user)
        if self.action in ("retrieve", "update", "partial_update", "destroy"):
            return qs
        if user.is_authenticated and user.is_staff:
            return qs
        return qs.filter(status=Product.Status.ACTIVE)

    def get_serializer_class(self):
        if self.action in ("create", "update", "partial_update"):
            return ProductWriteSerializer
        if self.action == "retrieve":
            return ProductDetailSerializer
        return ProductListSerializer

    def perform_create(self, serializer):
        serializer.save(seller=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        Product.objects.filter(pk=instance.pk).update(views_count=F("views_count") + 1)
        instance.refresh_from_db(fields=["views_count"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)

    def _home_section(self, request, queryset):
        limit = int(request.query_params.get("limit", HOME_SECTION_LIMIT))
        serializer = ProductListSerializer(queryset[:limit], many=True, context={"request": request})
        return Response(serializer.data)

    @action(detail=False)
    def trending(self, request):
        qs = self.get_queryset().filter(status=Product.Status.ACTIVE).order_by("-views_count", "-created_at")
        return self._home_section(request, qs)

    @action(detail=False)
    def recent(self, request):
        qs = self.get_queryset().filter(status=Product.Status.ACTIVE).order_by("-created_at")
        return self._home_section(request, qs)

    @action(detail=False)
    def donations(self, request):
        qs = self.get_queryset().filter(
            status=Product.Status.ACTIVE, transaction_type=Product.TransactionType.FREE_DONATION
        ).order_by("-created_at")
        return self._home_section(request, qs)

    @action(detail=False)
    def exchange(self, request):
        qs = self.get_queryset().filter(
            status=Product.Status.ACTIVE,
            transaction_type__in=[Product.TransactionType.FOR_EXCHANGE, Product.TransactionType.SALE_OR_EXCHANGE],
        ).order_by("-created_at")
        return self._home_section(request, qs)

    @action(detail=False)
    def near(self, request):
        location = request.query_params.get("location", "")
        qs = self.get_queryset().filter(status=Product.Status.ACTIVE)
        if location:
            qs = qs.filter(location__icontains=location)
        return self._home_section(request, qs.order_by("-created_at"))

    @action(detail=True, methods=["get"], url_path="exchange-recommendations")
    def exchange_recommendations(self, request, pk=None):
        product = self.get_object()
        recommendations = get_exchange_recommendations(product)
        data = [
            {
                "product": ProductListSerializer(item["product"], context={"request": request}).data,
                "score": item["score"],
                "reasons": item["reasons"],
            }
            for item in recommendations
        ]
        return Response(data)

    @action(detail=True, methods=["post"], url_path="images", permission_classes=[permissions.IsAuthenticated])
    def upload_image(self, request, pk=None):
        product = self.get_object()
        if product.seller_id != request.user.id and not request.user.is_staff:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        serializer = ProductImageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        is_primary = request.data.get("is_primary") in ("true", "True", True) or not product.images.exists()
        serializer.save(product=product, is_primary=is_primary)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(
        detail=True,
        methods=["delete"],
        url_path=r"images/(?P<image_id>\d+)",
        permission_classes=[permissions.IsAuthenticated],
    )
    def delete_image(self, request, pk=None, image_id=None):
        product = self.get_object()
        if product.seller_id != request.user.id and not request.user.is_staff:
            return Response({"detail": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        image = get_object_or_404(ProductImage, pk=image_id, product=product)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class WishlistView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        items = wishlist.items.select_related("product", "product__category").prefetch_related("product__images")
        serializer = WishlistItemSerializer(items, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request):
        wishlist, _ = Wishlist.objects.get_or_create(user=request.user)
        serializer = WishlistItemSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        product = serializer.validated_data["product"]
        item, created = WishlistItem.objects.get_or_create(wishlist=wishlist, product=product)
        return Response(
            WishlistItemSerializer(item, context={"request": request}).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )


class WishlistItemDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, product_id):
        wishlist = get_object_or_404(Wishlist, user=request.user)
        WishlistItem.objects.filter(wishlist=wishlist, product_id=product_id).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SellerDashboardView(APIView):
    """Aggregate stats + action counters for a seller's own dashboard."""

    permission_classes = [IsSeller, permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum

        from apps.donations.models import DonationRequest
        from apps.exchanges.models import ExchangeRequest
        from apps.orders.models import Order, OrderItem

        user = request.user
        products = Product.objects.filter(seller=user)

        sales_items = OrderItem.objects.filter(seller=user, order__status=Order.Status.COMPLETED)
        sales_total = sales_items.aggregate(total=Sum("price"))["total"] or 0

        data = {
            "active_listings": products.filter(status=Product.Status.ACTIVE).count(),
            "sold_items": products.filter(status=Product.Status.SOLD).count(),
            "pending_orders": OrderItem.objects.filter(
                seller=user, order__status__in=[Order.Status.PENDING, Order.Status.CONFIRMED, Order.Status.PROCESSING]
            ).values("order").distinct().count(),
            "pending_exchange_requests": ExchangeRequest.objects.filter(
                receiver=user, status=ExchangeRequest.Status.PENDING
            ).count(),
            "pending_donation_requests": DonationRequest.objects.filter(
                product__seller=user, status=DonationRequest.Status.PENDING
            ).count(),
            "total_views": products.aggregate(total=Sum("views_count"))["total"] or 0,
            "sales_stats": {
                "items_sold": sales_items.count(),
                "total_revenue": sales_total,
            },
        }
        return Response(data)
