from django.contrib import admin

from .models import DonationRequest


@admin.register(DonationRequest)
class DonationRequestAdmin(admin.ModelAdmin):
    list_display = ["id", "product", "requester", "status", "created_at"]
    list_filter = ["status"]
