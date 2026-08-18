from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from .models import User


class RegistrationLoginTests(APITestCase):
    def test_register_creates_user_and_returns_tokens(self):
        url = reverse("register")
        payload = {
            "full_name": "Test User",
            "email": "newuser@example.com",
            "password": "StrongPass123!",
            "password2": "StrongPass123!",
            "location": "Kigali",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)
        self.assertTrue(User.objects.filter(email="newuser@example.com").exists())

    def test_register_rejects_mismatched_passwords(self):
        url = reverse("register")
        payload = {
            "full_name": "Test User", "email": "mismatch@example.com",
            "password": "StrongPass123!", "password2": "Different123!", "location": "Kigali",
        }
        response = self.client.post(url, payload)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_email_and_password(self):
        User.objects.create_user(email="login@example.com", password="StrongPass123!", full_name="Login User")
        response = self.client.post(reverse("login"), {"email": "login@example.com", "password": "StrongPass123!"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_login_with_wrong_password_fails(self):
        User.objects.create_user(email="login2@example.com", password="StrongPass123!", full_name="Login User")
        response = self.client.post(reverse("login"), {"email": "login2@example.com", "password": "wrong"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="me@example.com", password="StrongPass123!", full_name="Me")

    def test_me_requires_authentication(self):
        response = self.client.get(reverse("me"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_returns_profile_when_authenticated(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(reverse("me"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "me@example.com")

    def test_become_seller(self):
        self.client.force_authenticate(self.user)
        response = self.client.post(reverse("become-seller"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.is_seller)
