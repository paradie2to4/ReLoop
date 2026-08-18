from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    ordering = ["-date_joined"]
    list_display = ["email", "full_name", "is_seller", "is_staff", "is_active", "date_joined"]
    list_filter = ["is_seller", "is_staff", "is_active"]
    search_fields = ["email", "full_name"]
    readonly_fields = ["date_joined", "updated_at"]
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Profile", {"fields": ("full_name", "phone", "location", "bio", "avatar")}),
        ("Roles", {"fields": ("is_seller", "is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Dates", {"fields": ("date_joined", "updated_at", "last_login")}),
    )
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "full_name", "password1", "password2", "is_seller", "is_staff", "is_superuser"),
        }),
    )
