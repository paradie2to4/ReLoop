from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("repair-providers", views.RepairProviderViewSet, basename="repair-provider")
router.register("repair-requests", views.RepairRequestViewSet, basename="repair-request")

urlpatterns = router.urls
