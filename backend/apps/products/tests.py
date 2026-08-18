from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User

from .models import Category, Product


class ProductTests(APITestCase):
    def setUp(self):
        self.category = Category.objects.create(name="Electronics")
        self.seller = User.objects.create_user(
            email="seller@example.com", password="Pass1234!", full_name="Seller", is_seller=True
        )
        self.other_seller = User.objects.create_user(
            email="seller2@example.com", password="Pass1234!", full_name="Seller Two", is_seller=True
        )
        self.customer = User.objects.create_user(
            email="customer@example.com", password="Pass1234!", full_name="Customer"
        )

    def _create_product(self, seller=None, **overrides):
        data = {
            "seller": seller or self.seller, "title": "Used Laptop", "description": "Works great",
            "category": self.category, "transaction_type": Product.TransactionType.FOR_SALE,
            "price": Decimal("100000"), "condition": Product.Condition.GOOD, "location": "Kigali",
        }
        data.update(overrides)
        return Product.objects.create(**data)

    def test_non_seller_cannot_create_product(self):
        self.client.force_authenticate(self.customer)
        response = self.client.post(reverse("product-list"), {
            "title": "New item", "description": "desc", "category": self.category.id,
            "transaction_type": "FOR_SALE", "price": "1000", "condition": "GOOD", "location": "Kigali",
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_seller_can_create_product(self):
        self.client.force_authenticate(self.seller)
        response = self.client.post(reverse("product-list"), {
            "title": "New item", "description": "desc", "category": self.category.id,
            "transaction_type": "FOR_SALE", "price": "1000", "condition": "GOOD", "location": "Kigali",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.get(title="New item").seller, self.seller)

    def test_donation_price_forced_to_zero(self):
        self.client.force_authenticate(self.seller)
        response = self.client.post(reverse("product-list"), {
            "title": "Free books", "description": "desc", "category": self.category.id,
            "transaction_type": "FREE_DONATION", "price": "5000", "condition": "GOOD", "location": "Kigali",
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Decimal(response.data["price"]), Decimal("0"))

    def test_sale_requires_positive_price(self):
        self.client.force_authenticate(self.seller)
        response = self.client.post(reverse("product-list"), {
            "title": "Bad price item", "description": "desc", "category": self.category.id,
            "transaction_type": "FOR_SALE", "price": "0", "condition": "GOOD", "location": "Kigali",
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_update_product(self):
        product = self._create_product()
        self.client.force_authenticate(self.seller)
        response = self.client.patch(reverse("product-detail", args=[product.id]), {"title": "Updated title"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        product.refresh_from_db()
        self.assertEqual(product.title, "Updated title")

    def test_non_owner_cannot_update_product(self):
        product = self._create_product()
        self.client.force_authenticate(self.other_seller)
        response = self.client.patch(reverse("product-detail", args=[product.id]), {"title": "Hacked title"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_owner_can_delete_product(self):
        product = self._create_product()
        self.client.force_authenticate(self.seller)
        response = self.client.delete(reverse("product-detail", args=[product.id]))
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Product.objects.filter(id=product.id).exists())

    def test_retrieve_increments_view_count(self):
        product = self._create_product()
        self.client.get(reverse("product-detail", args=[product.id]))
        product.refresh_from_db()
        self.assertEqual(product.views_count, 1)

    def test_filter_by_category_and_price(self):
        cheap = self._create_product(title="Cheap phone", price=Decimal("10000"))
        expensive = self._create_product(title="Expensive laptop", price=Decimal("900000"))
        response = self.client.get(reverse("product-list"), {"max_price": "50000"})
        titles = [item["title"] for item in response.data["results"]]
        self.assertIn(cheap.title, titles)
        self.assertNotIn(expensive.title, titles)

    def test_search_by_title(self):
        self._create_product(title="Vintage Camera")
        self._create_product(title="Office Chair")
        response = self.client.get(reverse("product-list"), {"search": "camera"})
        titles = [item["title"] for item in response.data["results"]]
        self.assertIn("Vintage Camera", titles)
        self.assertNotIn("Office Chair", titles)

    def test_archived_products_hidden_from_public_list(self):
        self._create_product(title="Archived item", status=Product.Status.ARCHIVED)
        response = self.client.get(reverse("product-list"))
        titles = [item["title"] for item in response.data["results"]]
        self.assertNotIn("Archived item", titles)
