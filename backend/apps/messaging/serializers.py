from rest_framework import serializers

from apps.accounts.models import User
from apps.products.models import Product

from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source="sender.full_name", read_only=True)

    class Meta:
        model = Message
        fields = ["id", "conversation", "sender", "sender_name", "text", "is_read", "created_at"]
        read_only_fields = ["sender", "is_read"]


class ConversationSerializer(serializers.ModelSerializer):
    other_participant_name = serializers.SerializerMethodField()
    other_participant_id = serializers.SerializerMethodField()
    product_title = serializers.CharField(source="product.title", read_only=True, default="")
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id", "product", "product_title", "other_participant_id", "other_participant_name",
            "last_message", "unread_count", "created_at", "updated_at",
        ]

    def _user(self):
        return self.context["request"].user

    def get_other_participant_name(self, obj):
        return obj.other_participant(self._user()).full_name

    def get_other_participant_id(self, obj):
        return obj.other_participant(self._user()).id

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        return MessageSerializer(last).data if last else None

    def get_unread_count(self, obj):
        return obj.messages.filter(is_read=False).exclude(sender=self._user()).count()


class ConversationDetailSerializer(ConversationSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + ["messages"]


class StartConversationSerializer(serializers.Serializer):
    recipient_id = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), source="recipient")
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), source="product", required=False, allow_null=True
    )
    text = serializers.CharField()
