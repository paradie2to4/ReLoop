from rest_framework import serializers

from .models import Notification

# Where a notification without its own link should take the user.
DEFAULT_LINKS = {
    Notification.Type.MESSAGE: "/messages",
    Notification.Type.EXCHANGE_REQUEST: "/exchange-requests",
    Notification.Type.EXCHANGE_ACCEPTED: "/exchange-requests",
    Notification.Type.EXCHANGE_REJECTED: "/exchange-requests",
    Notification.Type.DONATION_REQUEST: "/donation-requests",
    Notification.Type.DONATION_ACCEPTED: "/donation-requests",
    Notification.Type.ORDER: "/orders",
    Notification.Type.PRODUCT_SOLD: "/orders",
    Notification.Type.REPAIR: "/repair-requests",
}


class NotificationSerializer(serializers.ModelSerializer):
    link = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ["id", "title", "message", "type", "link", "is_read", "created_at"]

    def get_link(self, obj):
        return obj.link or DEFAULT_LINKS.get(obj.type, "")
