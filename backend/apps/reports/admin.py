from django.contrib import admin

from .models import Report


@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ["id", "reporter", "product", "reported_user", "reason", "status", "created_at"]
    list_filter = ["reason", "status"]
