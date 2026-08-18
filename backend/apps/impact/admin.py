from django.contrib import admin

from .models import ImpactCategoryConfig, ImpactRecord


@admin.register(ImpactCategoryConfig)
class ImpactCategoryConfigAdmin(admin.ModelAdmin):
    list_display = ["category", "avg_weight_saved_kg", "avg_co2_saved_kg"]


@admin.register(ImpactRecord)
class ImpactRecordAdmin(admin.ModelAdmin):
    list_display = ["user", "product", "transaction_type", "estimated_weight_saved", "estimated_co2_saved", "created_at"]
    list_filter = ["transaction_type"]
