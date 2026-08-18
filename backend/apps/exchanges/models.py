from django.conf import settings
from django.db import models

from apps.products.models import Product


class ExchangeRequest(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        ACCEPTED = "ACCEPTED", "Accepted"
        REJECTED = "REJECTED", "Rejected"
        CANCELLED = "CANCELLED", "Cancelled"
        COMPLETED = "COMPLETED", "Completed"

    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_exchanges")
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="received_exchanges")
    offered_product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="offered_in_exchanges")
    requested_product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="requested_in_exchanges")
    additional_cash = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    message = models.CharField(max_length=500, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Exchange #{self.pk}: {self.offered_product} <-> {self.requested_product}"
