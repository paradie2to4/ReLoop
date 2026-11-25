from django.conf import settings
from django.core.management.base import BaseCommand, CommandError

from apps.orders import momo


class Command(BaseCommand):
    help = (
        "Create an MTN MoMo sandbox API user and API key. Needs MOMO_SUBSCRIPTION_KEY "
        "(your Collections primary key from momodeveloper.mtn.com) in the environment."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--callback-host",
            default="localhost",
            help="Host name MTN may call back, e.g. your backend's domain (default: localhost).",
        )

    def handle(self, *args, **options):
        if settings.MOMO_TARGET_ENVIRONMENT != "sandbox":
            raise CommandError("This command only works with MOMO_TARGET_ENVIRONMENT=sandbox.")
        if not settings.MOMO_SUBSCRIPTION_KEY:
            raise CommandError("Set MOMO_SUBSCRIPTION_KEY first (Collections primary key from momodeveloper.mtn.com).")
        try:
            api_user, api_key = momo.create_sandbox_api_user(options["callback_host"])
        except momo.MomoError as exc:
            raise CommandError(str(exc))
        self.stdout.write(self.style.SUCCESS("Sandbox API user created. Add these to your .env:"))
        self.stdout.write(f"MOMO_API_USER={api_user}")
        self.stdout.write(f"MOMO_API_KEY={api_key}")
