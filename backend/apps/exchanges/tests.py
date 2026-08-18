from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.products.models import Category, Product

from .models import ExchangeRequest


class ExchangeRequestTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Electronics")
        self.alice = User.objects.create_user(email="alice@example.com", password="Pass1234!", full_name="Alice", is_seller=True)
        self.bob = User.objects.create_user(email="bob@example.com", password="Pass1234!", full_name="Bob", is_seller=True)

        self.alice_product = Product.objects.create(
            seller=self.alice, title="Alice's Laptop", description="d", category=self.category,
            transaction_type=Product.TransactionType.SALE_OR_EXCHANGE, price=Decimal("100000"),
            condition=Product.Condition.GOOD, location="Kigali",
        )
        self.bob_product = Product.objects.create(
            seller=self.bob, title="Bob's Tablet", description="d", category=self.category,
            transaction_type=Product.TransactionType.FOR_EXCHANGE, price=Decimal("0"),
            condition=Product.Condition.GOOD, location="Kigali",
        )

    def test_cannot_offer_someone_elses_product(self):
        self.client.force_authenticate(self.alice)
        response = self.client.post(reverse("exchange-list"), {
            "offered_product": self.bob_product.id, "requested_product": self.bob_product.id, "message": "hi",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_and_accept_and_complete_exchange(self):
        self.client.force_authenticate(self.alice)
        response = self.client.post(reverse("exchange-list"), {
            "offered_product": self.alice_product.id, "requested_product": self.bob_product.id, "message": "Swap?",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        exchange_id = response.data["id"]

        # Alice cannot accept her own sent request.
        response = self.client.patch(reverse("exchange-respond", args=[exchange_id]), {"action": "accept"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.bob)
        response = self.client.patch(reverse("exchange-respond", args=[exchange_id]), {"action": "accept"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "ACCEPTED")

        self.alice_product.refresh_from_db()
        self.assertEqual(self.alice_product.status, Product.Status.RESERVED)

        response = self.client.patch(reverse("exchange-respond", args=[exchange_id]), {"action": "complete"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "COMPLETED")

        self.alice_product.refresh_from_db()
        self.bob_product.refresh_from_db()
        self.assertEqual(self.alice_product.status, Product.Status.EXCHANGED)
        self.assertEqual(self.bob_product.status, Product.Status.EXCHANGED)

    def test_receiver_can_reject(self):
        self.client.force_authenticate(self.alice)
        exchange_id = self.client.post(reverse("exchange-list"), {
            "offered_product": self.alice_product.id, "requested_product": self.bob_product.id, "message": "Swap?",
        }).data["id"]

        self.client.force_authenticate(self.bob)
        response = self.client.patch(reverse("exchange-respond", args=[exchange_id]), {"action": "reject"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(ExchangeRequest.objects.get(id=exchange_id).status, "REJECTED")
