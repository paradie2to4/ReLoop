from decimal import Decimal

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.messaging.models import Conversation
from apps.products.models import Category, Product

from .models import Notification


class MessageNotificationTests(APITestCase):
    def setUp(self):
        self.seller = User.objects.create_user(email="seller@example.com", password="Pass1234!", full_name="Aline Seller", is_seller=True)
        self.buyer = User.objects.create_user(email="buyer@example.com", password="Pass1234!", full_name="Eric Buyer")
        category = Category.objects.create(name="Sports")
        self.product = Product.objects.create(
            seller=self.seller, title="Bicycle", description="desc", category=category,
            transaction_type=Product.TransactionType.FOR_SALE, price=Decimal("75000"),
            condition=Product.Condition.GOOD, location="Kigali", quantity=1,
        )

    def start_chat(self, text="Hi, is the bicycle still available?"):
        self.client.force_authenticate(self.buyer)
        response = self.client.post(reverse("conversation-list"), {
            "recipient_id": self.seller.id, "product_id": self.product.id, "text": text,
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        return response.data["id"]

    def test_new_message_notification_links_to_the_chat_and_previews_text(self):
        conv_id = self.start_chat()
        n = Notification.objects.get(user=self.seller)
        self.assertEqual(n.link, f"/messages/{conv_id}")
        self.assertEqual(n.title, "New message from Eric Buyer")
        self.assertIn("still available", n.message)

    def test_summary_counts_unread_messages_and_notifications(self):
        self.start_chat()
        self.client.force_authenticate(self.seller)
        data = self.client.get(reverse("notification-summary")).data
        self.assertEqual(data["unread_messages"], 1)
        self.assertEqual(data["unread_notifications"], 1)
        self.assertEqual(data["latest"][0]["type"], "MESSAGE")

    def test_opening_the_chat_clears_its_message_and_notification(self):
        conv_id = self.start_chat()
        self.client.force_authenticate(self.seller)
        self.client.get(reverse("conversation-detail", args=[conv_id]))
        data = self.client.get(reverse("notification-summary")).data
        self.assertEqual(data["unread_messages"], 0)
        self.assertEqual(data["unread_notifications"], 0)

    def test_reply_notifies_the_other_person(self):
        conv_id = self.start_chat()
        self.client.force_authenticate(self.seller)
        self.client.post(reverse("message-create"), {"conversation": conv_id, "text": "Yes, it is still for sale"})
        n = Notification.objects.get(user=self.buyer)
        self.assertEqual(n.link, f"/messages/{conv_id}")
        self.assertEqual(Conversation.objects.count(), 1)

    def test_notification_without_link_gets_a_default_page(self):
        Notification.objects.create(user=self.seller, title="t", message="m", type="EXCHANGE_REQUEST")
        self.client.force_authenticate(self.seller)
        data = self.client.get(reverse("notifications")).data
        results = data.get("results", data)
        self.assertEqual(results[0]["link"], "/exchange-requests")

    def test_summary_requires_login(self):
        response = self.client.get(reverse("notification-summary"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
