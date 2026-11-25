from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)


class NotificationMarkReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, pk):
        updated = Notification.objects.filter(pk=pk, user=request.user).update(is_read=True)
        if not updated:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response({"detail": "Marked as read."})


class NotificationSummaryView(APIView):
    """Small, cheap payload the header polls: unread counts plus the newest
    unread notifications (so the app can pop up an alert for new ones)."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.db.models import Q

        from apps.donations.models import DonationRequest
        from apps.exchanges.models import ExchangeRequest
        from apps.messaging.models import Message

        user = request.user
        unread = Notification.objects.filter(user=user, is_read=False)
        unread_messages = (
            Message.objects.filter(is_read=False)
            .filter(Q(conversation__participant_1=user) | Q(conversation__participant_2=user))
            .exclude(sender=user)
            .count()
        )
        pending_exchanges = ExchangeRequest.objects.filter(receiver=user, status=ExchangeRequest.Status.PENDING).count()
        pending_donations = DonationRequest.objects.filter(
            product__seller=user, status=DonationRequest.Status.PENDING
        ).count()
        return Response({
            "unread_notifications": unread.count(),
            "unread_messages": unread_messages,
            "pending_exchange_requests": pending_exchanges,
            "pending_donation_requests": pending_donations,
            "latest": NotificationSerializer(unread[:5], many=True).data,
        })


class NotificationMarkAllReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request):
        Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"detail": "All notifications marked as read."})
