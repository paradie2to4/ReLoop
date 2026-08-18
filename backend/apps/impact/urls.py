from django.urls import path

from . import views

urlpatterns = [
    path("", views.ImpactDashboardView.as_view(), name="impact-dashboard"),
]
