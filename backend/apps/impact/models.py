from django.conf import settings
from django.db import models

from apps.products.models import Category, Product


class ImpactCategoryConfig(models.Model):
    """Admin-editable estimate of environmental impact per category.

    Lets administrators tune the numbers shown on the Impact Dashboard
    without a deploy. Falls back to settings.IMPACT_DEFAULT_CATEGORY_WEIGHTS
    when no row exists for a category.
    """

    category = models.OneToOneField(Category, on_delete=models.CASCADE, related_name="impact_config")
    avg_weight_saved_kg = models.DecimalField(max_digits=8, decimal_places=2)
    avg_co2_saved_kg = models.DecimalField(max_digits=8, decimal_places=2)

    def __str__(self):
        return f"Impact config for {self.category.name}"


class ImpactRecord(models.Model):
    class TransactionType(models.TextChoices):
        SALE = "SALE", "Sale"
        DONATION = "DONATION", "Donation"
        EXCHANGE = "EXCHANGE", "Exchange"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="impact_records")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, related_name="impact_records")
    transaction_type = models.CharField(max_length=20, choices=TransactionType.choices)
    estimated_weight_saved = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    estimated_co2_saved = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.transaction_type} impact for {self.user.email}"
