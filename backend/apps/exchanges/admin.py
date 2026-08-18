from django.contrib import admin

from .models import ExchangeRequest


@admin.register(ExchangeRequest)
class ExchangeRequestAdmin(admin.ModelAdmin):
    list_display = ["id", "sender", "receiver", "offered_product", "requested_product", "status", "created_at"]
    list_filter = ["status"]
