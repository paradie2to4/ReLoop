from django.contrib import admin

from .models import Category, Product, ProductImage, Wishlist, WishlistItem


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["name", "slug"]
    prepopulated_fields = {"slug": ("name",)}


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ["title", "seller", "category", "transaction_type", "price", "status", "created_at"]
    list_filter = ["status", "transaction_type", "condition", "category"]
    search_fields = ["title", "description", "seller__email"]
    inlines = [ProductImageInline]


admin.site.register(Wishlist)
admin.site.register(WishlistItem)
