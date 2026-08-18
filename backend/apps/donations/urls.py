from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("donations", views.DonationRequestViewSet, basename="donation")

urlpatterns = router.urls
