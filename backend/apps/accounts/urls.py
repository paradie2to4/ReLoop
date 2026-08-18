from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

router = DefaultRouter()
router.register("admin/users", views.AdminUserViewSet, basename="admin-users")

urlpatterns = [
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token-refresh"),
    path("me/", views.MeView.as_view(), name="me"),
    path("become-seller/", views.BecomeSellerView.as_view(), name="become-seller"),
    path("users/<int:pk>/", views.PublicSellerProfileView.as_view(), name="public-seller-profile"),
    path("admin/analytics/", views.AdminAnalyticsView.as_view(), name="admin-analytics"),
    path("", include(router.urls)),
]
