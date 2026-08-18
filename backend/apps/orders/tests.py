from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.products.models import Category, Product

from .models import Order


class CartAndCheckoutTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Electronics")
        self.seller = User.objects.create_user(email="seller@example.com", password="Pass1234!", full_name="Seller", is_seller=True)
        self.buyer = User.objects.create_user(email="buyer@example.com", password="Pass1234!", full_name="Buyer")
        self.product = Product.objects.create(
            seller=self.seller, title="Used Phone", description="desc", category=self.category,
            transaction_type=Product.TransactionType.FOR_SALE, price=Decimal("50000"),
            condition=Product.Condition.GOOD, location="Kigali", quantity=1,
        )
        self.client.force_authenticate(self.buyer)

    def test_add_item_to_cart(self):
        response = self.client.post(reverse("cart-items"), {"product_id": self.product.id, "quantity": 1})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        cart = self.client.get(reverse("cart")).data
        self.assertEqual(len(cart["items"]), 1)

    def test_update_cart_item_quantity(self):
        item = self.client.post(reverse("cart-items"), {"product_id": self.product.id, "quantity": 1}).data
        response = self.client.patch(reverse("cart-item-detail", args=[item["id"]]), {"quantity": 3})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["quantity"], 3)

    def test_remove_cart_item(self):
        item = self.client.post(reverse("cart-items"), {"product_id": self.product.id, "quantity": 1}).data
        response = self.client.delete(reverse("cart-item-detail", args=[item["id"]]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_checkout_creates_order_and_clears_cart(self):
        self.client.post(reverse("cart-items"), {"product_id": self.product.id, "quantity": 1})
        response = self.client.post(reverse("order-list"), {
            "payment_method": "CASH", "shipping_location": "Kigali",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data["total_amount"]), Decimal("50000"))
        cart = self.client.get(reverse("cart")).data
        self.assertEqual(len(cart["items"]), 0)
        self.product.refresh_from_db()
        self.assertEqual(self.product.quantity, 0)

    def test_checkout_with_empty_cart_fails(self):
        response = self.client.post(reverse("order-list"), {"payment_method": "CASH", "shipping_location": "Kigali"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_only_seller_can_update_order_status(self):
        self.client.post(reverse("cart-items"), {"product_id": self.product.id, "quantity": 1})
        order_id = self.client.post(reverse("order-list"), {"payment_method": "CASH", "shipping_location": "Kigali"}).data["id"]

        response = self.client.patch(reverse("order-status", args=[order_id]), {"status": "CONFIRMED"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.client.force_authenticate(self.seller)
        response = self.client.patch(reverse("order-status", args=[order_id]), {"status": "CONFIRMED"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "CONFIRMED")

    def test_completing_order_creates_impact_record(self):
        from apps.impact.models import ImpactRecord

        self.client.post(reverse("cart-items"), {"product_id": self.product.id, "quantity": 1})
        order_id = self.client.post(reverse("order-list"), {"payment_method": "CASH", "shipping_location": "Kigali"}).data["id"]

        self.client.force_authenticate(self.seller)
        self.client.patch(reverse("order-status", args=[order_id]), {"status": "COMPLETED"})

        self.assertTrue(ImpactRecord.objects.filter(user=self.buyer, product=self.product, transaction_type="SALE").exists())
        order = Order.objects.get(id=order_id)
        self.assertEqual(order.status, Order.Status.COMPLETED)
