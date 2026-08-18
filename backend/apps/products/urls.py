from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("categories", views.CategoryViewSet, basename="category")
router.register("products", views.ProductViewSet, basename="product")

urlpatterns = [
    path("wishlist/", views.WishlistView.as_view(), name="wishlist"),
    path("wishlist/<int:product_id>/", views.WishlistItemDetailView.as_view(), name="wishlist-item"),
    path("seller/dashboard/", views.SellerDashboardView.as_view(), name="seller-dashboard"),
    path("", include(router.urls)),
]
