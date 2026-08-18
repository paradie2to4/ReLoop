from django.conf import settings
from django.db import models

from apps.products.models import Product


class Report(models.Model):
    class Reason(models.TextChoices):
        SCAM = "SCAM", "Scam"
        FAKE_PRODUCT = "FAKE_PRODUCT", "Fake product"
        INAPPROPRIATE = "INAPPROPRIATE", "Inappropriate content"
        WRONG_INFO = "WRONG_INFO", "Wrong information"
        OTHER = "OTHER", "Other"

    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        REVIEWED = "REVIEWED", "Reviewed"
        RESOLVED = "RESOLVED", "Resolved"
        DISMISSED = "DISMISSED", "Dismissed"

    reporter = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="reports_filed")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, related_name="reports")
    reported_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="reports_against"
    )
    reason = models.CharField(max_length=20, choices=Reason.choices)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Report #{self.pk} ({self.reason})"
