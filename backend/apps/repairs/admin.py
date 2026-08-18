from django.contrib import admin

from .models import RepairProvider, RepairRequest


@admin.register(RepairProvider)
class RepairProviderAdmin(admin.ModelAdmin):
    list_display = ["name", "specialization", "location", "rating", "is_active"]
    list_filter = ["specialization", "is_active"]


@admin.register(RepairRequest)
class RepairRequestAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "repair_provider", "status", "estimated_cost", "created_at"]
    list_filter = ["status"]
