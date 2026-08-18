"""Estimated (not scientifically precise) environmental impact calculation.

impact = category_weight x condition_factor

category_weight comes from an admin-editable ImpactCategoryConfig row, or
falls back to settings.IMPACT_DEFAULT_CATEGORY_WEIGHTS. condition_factor
reflects that reusing an item in worse condition (e.g. NEEDS_REPAIR) avoids
slightly more waste than reusing something that was practically new.
"""

from decimal import ROUND_HALF_UP, Decimal

from django.conf import settings

from .models import ImpactCategoryConfig, ImpactRecord

CONDITION_FACTORS = {
    "NEW": Decimal("0.6"),
    "LIKE_NEW": Decimal("0.8"),
    "GOOD": Decimal("1.0"),
    "FAIR": Decimal("1.1"),
    "NEEDS_REPAIR": Decimal("1.3"),
}

TWO_PLACES = Decimal("0.01")


class ImpactCalculationService:
    @staticmethod
    def _category_weights(category):
        config = ImpactCategoryConfig.objects.filter(category=category).first()
        if config:
            return config.avg_weight_saved_kg, config.avg_co2_saved_kg
        default = settings.IMPACT_DEFAULT_CATEGORY_WEIGHTS.get(
            category.name if category else None, settings.IMPACT_DEFAULT_CATEGORY_WEIGHTS["Other"]
        )
        avg_kg, co2_kg = default
        return Decimal(str(avg_kg)), Decimal(str(co2_kg))

    @classmethod
    def record(cls, user, product, transaction_type):
        avg_kg, co2_kg = cls._category_weights(product.category)
        factor = CONDITION_FACTORS.get(product.condition, Decimal("1.0"))
        return ImpactRecord.objects.create(
            user=user,
            product=product,
            transaction_type=transaction_type,
            estimated_weight_saved=(avg_kg * factor).quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
            estimated_co2_saved=(co2_kg * factor).quantize(TWO_PLACES, rounding=ROUND_HALF_UP),
        )
