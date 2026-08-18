from django.conf import settings
from django.db import models


class Notification(models.Model):
    class Type(models.TextChoices):
        EXCHANGE_REQUEST = "EXCHANGE_REQUEST", "New exchange request"
        EXCHANGE_ACCEPTED = "EXCHANGE_ACCEPTED", "Exchange accepted"
        EXCHANGE_REJECTED = "EXCHANGE_REJECTED", "Exchange rejected"
        DONATION_REQUEST = "DONATION_REQUEST", "New donation request"
        DONATION_ACCEPTED = "DONATION_ACCEPTED", "Donation accepted"
        ORDER = "ORDER", "Order update"
        MESSAGE = "MESSAGE", "New message"
        PRODUCT_SOLD = "PRODUCT_SOLD", "Product sold"
        REVIEW = "REVIEW", "Review received"
        REPAIR = "REPAIR", "Repair update"
        GENERAL = "GENERAL", "General"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications")
    title = models.CharField(max_length=150)
    message = models.CharField(max_length=500)
    type = models.CharField(max_length=30, choices=Type.choices, default=Type.GENERAL)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "is_read"])]

    def __str__(self):
        return f"{self.type} -> {self.user.email}"
