from django.contrib import admin

from .models import Cart, CartItem, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "buyer", "status", "payment_method", "payment_status", "total_amount", "created_at"]
    list_filter = ["status", "payment_method", "payment_status"]
    inlines = [OrderItemInline]


admin.site.register(Cart)
admin.site.register(CartItem)
