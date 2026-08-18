from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    description = models.CharField(max_length=255, blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Icon name/emoji shown in UI")

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ["name"]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    class TransactionType(models.TextChoices):
        FOR_SALE = "FOR_SALE", "For Sale"
        FOR_EXCHANGE = "FOR_EXCHANGE", "For Exchange"
        FREE_DONATION = "FREE_DONATION", "Free Donation"
        SALE_OR_EXCHANGE = "SALE_OR_EXCHANGE", "Sale or Exchange"

    class Condition(models.TextChoices):
        NEW = "NEW", "New"
        LIKE_NEW = "LIKE_NEW", "Like New"
        GOOD = "GOOD", "Good"
        FAIR = "FAIR", "Fair"
        NEEDS_REPAIR = "NEEDS_REPAIR", "Needs Repair"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Active"
        RESERVED = "RESERVED", "Reserved"
        SOLD = "SOLD", "Sold"
        DONATED = "DONATED", "Donated"
        EXCHANGED = "EXCHANGED", "Exchanged"
        ARCHIVED = "ARCHIVED", "Archived"

    seller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="products")
    title = models.CharField(max_length=200)
    description = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    condition = models.CharField(max_length=20, choices=Condition.choices)
    location = models.CharField(max_length=150)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    quantity = models.PositiveIntegerField(default=1)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    views_count = models.PositiveIntegerField(default=0)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["status", "transaction_type"]),
            models.Index(fields=["category"]),
            models.Index(fields=["-created_at"]),
            models.Index(fields=["-views_count"]),
        ]

    def __str__(self):
        return self.title

    @property
    def is_donation(self):
        return self.transaction_type == self.TransactionType.FREE_DONATION

    @property
    def allows_exchange(self):
        return self.transaction_type in (self.TransactionType.FOR_EXCHANGE, self.TransactionType.SALE_OR_EXCHANGE)

    @property
    def allows_purchase(self):
        return self.transaction_type in (self.TransactionType.FOR_SALE, self.TransactionType.SALE_OR_EXCHANGE)


class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to="products/")
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self):
        return f"Image #{self.pk} for {self.product.title}"


class Wishlist(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="wishlist")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Wishlist({self.user.email})"


class WishlistItem(models.Model):
    wishlist = models.ForeignKey(Wishlist, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="wishlisted_by")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ["wishlist", "product"]
        ordering = ["-created_at"]
