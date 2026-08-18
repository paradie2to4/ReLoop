from django.conf import settings
from django.db import models

from apps.products.models import Product


class RepairProvider(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    specialization = models.CharField(max_length=150, help_text="e.g. Phone Repair, Furniture Repair")
    location = models.CharField(max_length=150)
    phone = models.CharField(max_length=30)
    email = models.EmailField(blank=True)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    image = models.ImageField(upload_to="repair_providers/", blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-rating", "name"]

    def __str__(self):
        return self.name


class RepairRequest(models.Model):
    class Status(models.TextChoices):
        REQUESTED = "REQUESTED", "Requested"
        ACCEPTED = "ACCEPTED", "Accepted"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        COMPLETED = "COMPLETED", "Completed"
        CANCELLED = "CANCELLED", "Cancelled"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="repair_requests")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True, related_name="repair_requests")
    repair_provider = models.ForeignKey(RepairProvider, on_delete=models.CASCADE, related_name="requests")
    problem_description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    estimated_cost = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"RepairRequest #{self.pk} ({self.status})"
