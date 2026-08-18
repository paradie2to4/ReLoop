from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register("conversations", views.ConversationViewSet, basename="conversation")

urlpatterns = [
    path("messages/", views.MessageCreateView.as_view(), name="message-create"),
    path("", include(router.urls)),
]
