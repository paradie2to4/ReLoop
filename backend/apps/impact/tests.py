from decimal import Decimal

from django.test import TestCase

from apps.accounts.models import User
from apps.products.models import Category, Product

from .models import ImpactCategoryConfig, ImpactRecord
from .services import ImpactCalculationService


class ImpactCalculationServiceTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(email="user@example.com", password="Pass1234!", full_name="User")
        self.category = Category.objects.create(name="Electronics")
        self.product = Product.objects.create(
            seller=self.user, title="Phone", description="d", category=self.category,
            transaction_type=Product.TransactionType.FOR_SALE, price=Decimal("50000"),
            condition=Product.Condition.GOOD, location="Kigali",
        )

    def test_record_uses_settings_default_weights_when_no_config(self):
        record = ImpactCalculationService.record(self.user, self.product, "SALE")
        self.assertIsInstance(record, ImpactRecord)
        # Electronics default = (4.5, 25.0) kg, GOOD condition factor = 1.0
        self.assertEqual(record.estimated_weight_saved, Decimal("4.50"))
        self.assertEqual(record.estimated_co2_saved, Decimal("25.00"))

    def test_record_uses_admin_configured_weights_when_present(self):
        ImpactCategoryConfig.objects.create(
            category=self.category, avg_weight_saved_kg=Decimal("10.00"), avg_co2_saved_kg=Decimal("20.00")
        )
        record = ImpactCalculationService.record(self.user, self.product, "SALE")
        self.assertEqual(record.estimated_weight_saved, Decimal("10.00"))
        self.assertEqual(record.estimated_co2_saved, Decimal("20.00"))

    def test_condition_factor_changes_estimate(self):
        self.product.condition = Product.Condition.NEEDS_REPAIR
        self.product.save()
        record = ImpactCalculationService.record(self.user, self.product, "SALE")
        # 4.5 * 1.3 = 5.85
        self.assertEqual(record.estimated_weight_saved, Decimal("5.85"))
