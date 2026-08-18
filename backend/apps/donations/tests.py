from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.products.models import Category, Product

from .models import DonationRequest


class DonationRequestTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Books")
        self.donor = User.objects.create_user(email="donor@example.com", password="Pass1234!", full_name="Donor", is_seller=True)
        self.requester1 = User.objects.create_user(email="req1@example.com", password="Pass1234!", full_name="Req One")
        self.requester2 = User.objects.create_user(email="req2@example.com", password="Pass1234!", full_name="Req Two")

        self.donation_product = Product.objects.create(
            seller=self.donor, title="Free Books", description="d", category=self.category,
            transaction_type=Product.TransactionType.FREE_DONATION, price=Decimal("0"),
            condition=Product.Condition.GOOD, location="Huye",
        )

    def test_cannot_request_own_donation(self):
        self.client.force_authenticate(self.donor)
        response = self.client.post(reverse("donation-list"), {"product": self.donation_product.id, "message": "please"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_accepting_one_request_rejects_others(self):
        self.client.force_authenticate(self.requester1)
        r1 = self.client.post(reverse("donation-list"), {"product": self.donation_product.id, "message": "me please"}).data

        self.client.force_authenticate(self.requester2)
        r2 = self.client.post(reverse("donation-list"), {"product": self.donation_product.id, "message": "me too"}).data

        self.client.force_authenticate(self.donor)
        response = self.client.patch(reverse("donation-respond", args=[r1["id"]]), {"action": "accept"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ACCEPTED")

        self.assertEqual(DonationRequest.objects.get(id=r2["id"]).status, "REJECTED")
        self.donation_product.refresh_from_db()
        self.assertEqual(self.donation_product.status, Product.Status.RESERVED)

    def test_complete_donation_marks_product_donated_and_records_impact(self):
        from apps.impact.models import ImpactRecord

        self.client.force_authenticate(self.requester1)
        request_id = self.client.post(reverse("donation-list"), {"product": self.donation_product.id, "message": "please"}).data["id"]

        self.client.force_authenticate(self.donor)
        self.client.patch(reverse("donation-respond", args=[request_id]), {"action": "accept"})
        response = self.client.patch(reverse("donation-respond", args=[request_id]), {"action": "complete"})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.donation_product.refresh_from_db()
        self.assertEqual(self.donation_product.status, Product.Status.DONATED)
        self.assertTrue(ImpactRecord.objects.filter(user=self.donor, transaction_type="DONATION").exists())
        self.assertTrue(ImpactRecord.objects.filter(user=self.requester1, transaction_type="DONATION").exists())
