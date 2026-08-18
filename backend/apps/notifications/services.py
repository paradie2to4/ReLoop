from .models import Notification


def notify(user, title, message, type=Notification.Type.GENERAL):
    return Notification.objects.create(user=user, title=title, message=message, type=type)
