from rest_framework import permissions, viewsets

from apps.accounts.permissions import IsAdmin
from apps.notifications.services import notify

from .models import RepairProvider, RepairRequest
from .serializers import AdminRepairRequestUpdateSerializer, RepairProviderSerializer, RepairRequestSerializer


class RepairProviderViewSet(viewsets.ModelViewSet):
    queryset = RepairProvider.objects.filter(is_active=True)
    serializer_class = RepairProviderSerializer
    filterset_fields = ["specialization", "location"]
    search_fields = ["name", "specialization", "location"]

    def get_permissions(self):
        if self.action in ("list", "retrieve"):
            return [permissions.AllowAny()]
        return [IsAdmin()]


class RepairRequestViewSet(viewsets.ModelViewSet):
    serializer_class = RepairRequestSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "patch", "head", "options"]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return RepairRequest.objects.all().select_related("repair_provider", "product")
        return RepairRequest.objects.filter(user=user).select_related("repair_provider", "product")

    def get_serializer_class(self):
        if self.action in ("update", "partial_update") and self.request.user.is_staff:
            return AdminRepairRequestUpdateSerializer
        return RepairRequestSerializer

    def perform_create(self, serializer):
        repair_request = serializer.save(user=self.request.user)
        notify(
            self.request.user,
            "Repair request submitted",
            f"Your repair request with {repair_request.repair_provider.name} was submitted.",
            "REPAIR",
        )

    def perform_update(self, serializer):
        repair_request = serializer.save()
        if not self.request.user.is_staff:
            return
        notify(
            repair_request.user,
            "Repair request update",
            f"Your repair request is now '{repair_request.get_status_display()}'.",
            "REPAIR",
        )
