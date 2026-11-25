from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("orders", views.OrderViewSet, basename="order")

urlpatterns = [
    path("cart/", views.CartView.as_view(), name="cart"),
    path("cart/items/", views.CartItemListCreateView.as_view(), name="cart-items"),
    path("cart/items/<int:pk>/", views.CartItemDetailView.as_view(), name="cart-item-detail"),
    path("payments/momo/config/", views.MomoConfigView.as_view(), name="momo-config"),
    path("payments/momo/callback/", views.MomoCallbackView.as_view(), name="momo-callback"),
    path("", include(router.urls)),
]
