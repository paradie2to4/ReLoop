from django.core.management.base import BaseCommand

from apps.orders.services import expire_unpaid_momo_orders


class Command(BaseCommand):
    help = "Cancel MoMo orders left unpaid past MOMO_ORDER_EXPIRY_MINUTES and return their items to stock."

    def handle(self, *args, **options):
        count = expire_unpaid_momo_orders(force=True)
        self.stdout.write(self.style.SUCCESS(f"Cancelled {count} unpaid MoMo order(s)."))
