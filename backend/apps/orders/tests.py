import uuid
from decimal import Decimal
from unittest.mock import MagicMock, patch

from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.products.models import Category, Product

from .models import MomoPayment, Order


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


MOMO_TEST_SETTINGS = {
    "MOMO_SUBSCRIPTION_KEY": "test-sub-key",
    "MOMO_API_USER": "test-user",
    "MOMO_API_KEY": "test-key",
    "MOMO_TARGET_ENVIRONMENT": "sandbox",
    "MOMO_CURRENCY": "EUR",
}

REFERENCE = "6f1b8a5e-4c2d-4e8f-9a7b-1c2d3e4f5a6b"


@override_settings(**MOMO_TEST_SETTINGS)
@patch("apps.orders.momo.request_to_pay", return_value=REFERENCE)
@patch("apps.orders.momo.get_payment_status")
class MomoPaymentTests(APITestCase):
    """MTN is never called for real here: the two network functions are mocked."""

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
        self.client.post(reverse("cart-items"), {"product_id": self.product.id, "quantity": 1})
        response = self.client.post(reverse("order-list"), {"payment_method": "MOMO", "shipping_location": "Kigali"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.order_id = response.data["id"]

    def pay(self, phone="0781234567"):
        return self.client.post(reverse("order-momo-pay", args=[self.order_id]), {"phone": phone})

    def check(self):
        return self.client.get(reverse("order-momo-status", args=[self.order_id]))

    def test_pay_sends_request_to_pay_with_normalized_phone(self, mock_status, mock_pay):
        response = self.pay("078 123 4567")
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        kwargs = mock_pay.call_args.kwargs
        self.assertEqual(kwargs["phone"], "250781234567")
        self.assertEqual(kwargs["amount"], "50000")
        self.assertEqual(kwargs["external_id"], f"reloop-order-{self.order_id}")
        self.assertEqual(response.data["momo_payment"]["status"], "PENDING")
        self.assertEqual(MomoPayment.objects.get().reference_id, uuid.UUID(REFERENCE))

    def test_successful_payment_marks_order_paid(self, mock_status, mock_pay):
        self.pay()
        mock_status.return_value = {"status": "SUCCESSFUL", "amount": "50000", "currency": "EUR", "financialTransactionId": "123456"}
        response = self.check()
        self.assertEqual(response.data["payment_status"], "PAID")
        self.assertEqual(response.data["momo_payment"]["status"], "SUCCESSFUL")
        self.assertEqual(MomoPayment.objects.get().financial_transaction_id, "123456")

    def test_pending_payment_stays_pending(self, mock_status, mock_pay):
        self.pay()
        mock_status.return_value = {"status": "PENDING"}
        response = self.check()
        self.assertEqual(response.data["payment_status"], "PENDING")
        self.assertEqual(response.data["momo_payment"]["status"], "PENDING")

    def test_failed_payment_can_be_retried(self, mock_status, mock_pay):
        self.pay()
        mock_status.return_value = {"status": "FAILED", "reason": "APPROVAL_REJECTED"}
        response = self.check()
        self.assertEqual(response.data["payment_status"], "FAILED")
        self.assertEqual(response.data["momo_payment"]["failure_reason"], "APPROVAL_REJECTED")

        mock_pay.return_value = "0a1b2c3d-0000-4000-8000-000000000001"
        response = self.pay()
        self.assertEqual(response.status_code, status.HTTP_202_ACCEPTED)
        self.assertEqual(response.data["payment_status"], "PENDING")
        self.assertEqual(MomoPayment.objects.count(), 2)

    def test_amount_mismatch_is_not_accepted(self, mock_status, mock_pay):
        self.pay()
        mock_status.return_value = {"status": "SUCCESSFUL", "amount": "1", "currency": "EUR"}
        response = self.check()
        self.assertNotEqual(response.data["payment_status"], "PAID")
        self.assertEqual(response.data["momo_payment"]["status"], "FAILED")

    def test_second_prompt_blocked_while_first_is_pending(self, mock_status, mock_pay):
        self.pay()
        mock_status.return_value = {"status": "PENDING"}
        response = self.pay()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(mock_pay.call_count, 1)

    def test_cannot_pay_twice(self, mock_status, mock_pay):
        self.pay()
        mock_status.return_value = {"status": "SUCCESSFUL", "amount": "50000", "currency": "EUR"}
        self.check()
        response = self.pay()
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_only_buyer_can_pay(self, mock_status, mock_pay):
        self.client.force_authenticate(self.seller)
        response = self.pay()
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        mock_pay.assert_not_called()

    def test_invalid_phone_rejected(self, mock_status, mock_pay):
        response = self.pay("12ab")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        mock_pay.assert_not_called()

    def test_seller_cannot_mark_momo_order_paid_by_hand(self, mock_status, mock_pay):
        self.client.force_authenticate(self.seller)
        response = self.client.patch(reverse("order-status", args=[self.order_id]), {"payment_status": "PAID"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.get(id=self.order_id).payment_status, "PENDING")

    def test_callback_rechecks_with_mtn_and_ignores_its_own_body(self, mock_status, mock_pay):
        self.pay()
        self.client.force_authenticate(None)
        # A fake callback claiming success must not be trusted if MTN says pending.
        mock_status.return_value = {"status": "PENDING"}
        body = {"externalId": f"reloop-order-{self.order_id}", "status": "SUCCESSFUL"}
        response = self.client.post(reverse("momo-callback"), body, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(Order.objects.get(id=self.order_id).payment_status, "PENDING")

        mock_status.return_value = {"status": "SUCCESSFUL", "amount": "50000", "currency": "EUR"}
        self.client.put(reverse("momo-callback"), body, format="json")
        self.assertEqual(Order.objects.get(id=self.order_id).payment_status, "PAID")


@override_settings(**MOMO_TEST_SETTINGS, MOMO_BASE_URL="https://sandbox.momodeveloper.mtn.com", MOMO_CALLBACK_URL="")
class MomoClientTests(APITestCase):
    """Checks the exact HTTP requests sent to MTN (the network itself is mocked)."""

    def setUp(self):
        from django.core.cache import cache

        cache.clear()

    @patch("apps.orders.momo.request.urlopen")
    def test_request_to_pay_builds_mtn_requests(self, mock_urlopen):
        import json

        from . import momo

        def fake_response(status_code, payload):
            resp = MagicMock(status=status_code)
            resp.read.return_value = json.dumps(payload).encode() if payload is not None else b""
            resp.__enter__.return_value = resp
            return resp

        mock_urlopen.side_effect = [
            fake_response(200, {"access_token": "tok123", "expires_in": 3600}),
            fake_response(202, None),
        ]
        ref = momo.request_to_pay(amount="50000", phone="250781234567", external_id="reloop-order-1",
                                  payer_message="ReLoop order #1", payee_note="Payment")

        token_req = mock_urlopen.call_args_list[0].args[0]
        self.assertEqual(token_req.full_url, "https://sandbox.momodeveloper.mtn.com/collection/token/")
        self.assertTrue(token_req.get_header("Authorization").startswith("Basic "))
        self.assertEqual(token_req.get_header("Ocp-apim-subscription-key"), "test-sub-key")

        pay_req = mock_urlopen.call_args_list[1].args[0]
        self.assertEqual(pay_req.full_url, "https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay")
        self.assertEqual(pay_req.get_method(), "POST")
        self.assertEqual(pay_req.get_header("Authorization"), "Bearer tok123")
        self.assertEqual(pay_req.get_header("X-target-environment"), "sandbox")
        self.assertEqual(pay_req.get_header("X-reference-id"), ref)
        body = json.loads(pay_req.data)
        self.assertEqual(body["currency"], "EUR")
        self.assertEqual(body["payer"], {"partyIdType": "MSISDN", "partyId": "250781234567"})
        uuid.UUID(ref)  # a valid UUID

    @patch("apps.orders.momo.request.urlopen")
    def test_http_errors_become_momo_errors(self, mock_urlopen):
        from urllib.error import HTTPError

        from . import momo

        mock_urlopen.side_effect = HTTPError("url", 401, "Unauthorized", {}, None)
        with self.assertRaises(momo.MomoError):
            momo.get_access_token()


class MomoDisabledTests(APITestCase):
    @override_settings(MOMO_SUBSCRIPTION_KEY="", MOMO_API_USER="", MOMO_API_KEY="")
    def test_checkout_with_momo_rejected_when_not_configured(self):
        user = User.objects.create_user(email="b@example.com", password="Pass1234!", full_name="B")
        self.client.force_authenticate(user)
        response = self.client.post(reverse("order-list"), {"payment_method": "MOMO", "shipping_location": "Kigali"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        config = self.client.get(reverse("momo-config")).data
        self.assertFalse(config["enabled"])

    @override_settings(MOMO_TARGET_ENVIRONMENT="mtnrwanda")
    def test_live_mode_only_accepts_rwandan_mtn_numbers(self):
        from rest_framework.exceptions import ValidationError

        from .services import normalize_momo_phone

        self.assertEqual(normalize_momo_phone("+250 79 123 4567"), "250791234567")
        with self.assertRaises(ValidationError):
            normalize_momo_phone("46733123450")
        with self.assertRaises(ValidationError):
            normalize_momo_phone("0721234567")  # not an MTN prefix
