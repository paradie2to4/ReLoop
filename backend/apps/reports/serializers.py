from rest_framework import serializers

from .models import Report


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = ["id", "reporter", "product", "reported_user", "reason", "description", "status", "created_at"]
        read_only_fields = ["reporter"]

    def validate(self, attrs):
        if not attrs.get("product") and not attrs.get("reported_user"):
            raise serializers.ValidationError("A report must target either a product or a user.")
        return attrs
