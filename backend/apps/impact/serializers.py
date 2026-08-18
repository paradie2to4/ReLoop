from rest_framework import serializers

from .models import ImpactRecord


class ImpactRecordSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source="product.title", read_only=True, default="")

    class Meta:
        model = ImpactRecord
        fields = [
            "id", "product", "product_title", "transaction_type",
            "estimated_weight_saved", "estimated_co2_saved", "created_at",
        ]


class ImpactDashboardSerializer(serializers.Serializer):
    items_reused = serializers.IntegerField()
    items_sold = serializers.IntegerField()
    items_donated = serializers.IntegerField()
    items_exchanged = serializers.IntegerField()
    estimated_weight_saved_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
    estimated_co2_saved_kg = serializers.DecimalField(max_digits=10, decimal_places=2)
    recent_records = ImpactRecordSerializer(many=True)
