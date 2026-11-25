from django.contrib import admin

from .models import Cart, CartItem, MomoPayment, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0


class MomoPaymentInline(admin.TabularInline):
    model = MomoPayment
    extra = 0
    can_delete = False
    readonly_fields = ["reference_id", "phone", "amount", "currency", "status", "financial_transaction_id", "failure_reason", "created_at"]


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ["id", "buyer", "status", "payment_method", "payment_status", "total_amount", "created_at"]
    list_filter = ["status", "payment_method", "payment_status"]
    inlines = [OrderItemInline, MomoPaymentInline]


@admin.register(MomoPayment)
class MomoPaymentAdmin(admin.ModelAdmin):
    list_display = ["reference_id", "order", "phone", "amount", "currency", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["reference_id", "phone", "financial_transaction_id"]
    readonly_fields = ["order", "reference_id", "phone", "amount", "currency", "status", "financial_transaction_id", "failure_reason", "created_at", "updated_at"]


admin.site.register(Cart)
admin.site.register(CartItem)
