from django.db.models import Q
from rest_framework import permissions, status, viewsets
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response

from apps.notifications.services import notify

from .models import Conversation, Message
from .serializers import (
    ConversationDetailSerializer,
    ConversationSerializer,
    MessageSerializer,
    StartConversationSerializer,
)


class ConversationViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        return Conversation.objects.filter(Q(participant_1=user) | Q(participant_2=user)).select_related(
            "participant_1", "participant_2", "product"
        )

    def get_serializer_class(self):
        if self.action == "retrieve":
            return ConversationDetailSerializer
        return ConversationSerializer

    def retrieve(self, request, *args, **kwargs):
        conversation = self.get_object()
        conversation.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
        serializer = self.get_serializer(conversation)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        serializer = StartConversationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        recipient = serializer.validated_data["recipient"]
        product = serializer.validated_data.get("product")
        text = serializer.validated_data["text"]

        if recipient == request.user:
            return Response({"detail": "You cannot message yourself."}, status=status.HTTP_400_BAD_REQUEST)

        conversation = (
            Conversation.objects.filter(
                Q(participant_1=request.user, participant_2=recipient)
                | Q(participant_1=recipient, participant_2=request.user),
                product=product,
            ).first()
        )
        if not conversation:
            conversation = Conversation.objects.create(
                participant_1=request.user, participant_2=recipient, product=product
            )

        Message.objects.create(conversation=conversation, sender=request.user, text=text)
        conversation.save(update_fields=["updated_at"])
        notify(recipient, "New message", f"{request.user.full_name} sent you a message.", "MESSAGE")

        return Response(
            ConversationDetailSerializer(conversation, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MessageCreateView(CreateAPIView):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        conversation = serializer.validated_data["conversation"]
        user = self.request.user
        if user not in (conversation.participant_1, conversation.participant_2):
            raise permissions.PermissionDenied("You are not part of this conversation.")
        message = serializer.save(sender=user)
        conversation.save(update_fields=["updated_at"])
        notify(conversation.other_participant(user), "New message", f"{user.full_name} sent you a message.", "MESSAGE")
        return message
