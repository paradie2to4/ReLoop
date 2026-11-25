import logging
import re
from decimal import Decimal, InvalidOperation

from django.conf import settings
from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.products.models import Product

from . import momo
from .models import Cart, MomoPayment, Order, OrderItem

logger = logging.getLogger(__name__)


@transaction.atomic
def checkout_cart(user, payment_method, shipping_location, notes=""):
    try:
        cart = Cart.objects.select_related("user").prefetch_related("items__product").get(user=user)
    except Cart.DoesNotExist:
        raise ValidationError("Your cart is empty.")

    items = list(cart.items.select_related("product"))
    if not items:
        raise ValidationError("Your cart is empty.")

    for item in items:
        product = item.product
        if product.status != Product.Status.ACTIVE:
            raise ValidationError(f"'{product.title}' is no longer available.")
        if product.quantity < item.quantity:
            raise ValidationError(f"Only {product.quantity} unit(s) of '{product.title}' left.")

    order = Order.objects.create(
        buyer=user,
        payment_method=payment_method,
        shipping_location=shipping_location,
        notes=notes,
        total_amount=sum(item.subtotal for item in items),
    )

    for item in items:
        product = item.product
        OrderItem.objects.create(
            order=order, product=product, seller=product.seller, quantity=item.quantity, price=product.price,
        )
        product.quantity -= item.quantity
        if product.quantity <= 0:
            product.status = Product.Status.RESERVED
        product.save(update_fields=["quantity", "status"])

    cart.items.all().delete()

    from apps.notifications.services import notify

    sellers = {item.product.seller for item in items}
    for seller in sellers:
        notify(seller, "New order received", f"You have a new order (#{order.id}).", "ORDER")

    return order


@transaction.atomic
def transition_order_status(order, new_status=None, new_payment_status=None):
    from apps.impact.services import ImpactCalculationService
    from apps.notifications.services import notify

    previous_status = order.status
    if new_status:
        order.status = new_status
    if new_payment_status:
        order.payment_status = new_payment_status
    order.save()

    if new_status == Order.Status.CANCELLED and previous_status != Order.Status.CANCELLED:
        for item in order.items.select_related("product"):
            product = item.product
            product.quantity += item.quantity
            if product.status == Product.Status.RESERVED:
                product.status = Product.Status.ACTIVE
            product.save(update_fields=["quantity", "status"])

    if new_status == Order.Status.COMPLETED and previous_status != Order.Status.COMPLETED:
        for item in order.items.select_related("product"):
            product = item.product
            if product.quantity <= 0:
                product.status = Product.Status.SOLD
                product.save(update_fields=["status"])
            ImpactCalculationService.record(user=order.buyer, product=product, transaction_type="SALE")

    notify(order.buyer, "Order update", f"Your order #{order.id} is now {order.status}.", "ORDER")
    return order


# --- MTN Mobile Money ---------------------------------------------------------

RWANDA_MTN_NUMBER = re.compile(r"^2507[89]\d{7}$")


def normalize_momo_phone(raw):
    """Turn '078 123 4567', '+250781234567' or '781234567' into '250781234567'.

    Live payments only accept Rwandan MTN numbers (078/079). The sandbox also
    accepts MTN's international test numbers, so there we only check digits.
    """
    phone = re.sub(r"[\s\-+()]", "", str(raw or ""))
    if re.fullmatch(r"07\d{8}", phone):
        phone = "250" + phone[1:]
    elif re.fullmatch(r"7\d{8}", phone):
        phone = "250" + phone
    if settings.MOMO_TARGET_ENVIRONMENT == "sandbox":
        if not re.fullmatch(r"\d{9,15}", phone):
            raise ValidationError({"phone": "Enter a valid phone number."})
    elif not RWANDA_MTN_NUMBER.fullmatch(phone):
        raise ValidationError({"phone": "Enter an MTN Rwanda number, e.g. 078 123 4567."})
    return phone


def _momo_amount(value):
    value = Decimal(value)
    return str(int(value)) if value == value.to_integral_value() else str(value)


def start_momo_payment(order, phone):
    """Send a MoMo payment prompt to the buyer's phone for this order."""
    if order.payment_method != Order.PaymentMethod.MOMO:
        raise ValidationError("This order is not set to be paid with MTN Mobile Money.")
    if order.payment_status == Order.PaymentStatus.PAID:
        raise ValidationError("This order has already been paid.")
    if order.status == Order.Status.CANCELLED:
        raise ValidationError("This order was cancelled.")

    phone = normalize_momo_phone(phone)

    # Don't send a second prompt while the first one is still waiting on the phone.
    pending = order.momo_payments.filter(status=MomoPayment.Status.PENDING).first()
    if pending:
        pending = refresh_momo_payment(pending)
        if pending.status == MomoPayment.Status.PENDING:
            raise ValidationError("A payment request is already waiting for approval on your phone.")
        order.refresh_from_db()
        if order.payment_status == Order.PaymentStatus.PAID:
            raise ValidationError("This order has already been paid.")

    try:
        reference_id = momo.request_to_pay(
            amount=_momo_amount(order.total_amount),
            phone=phone,
            external_id=f"reloop-order-{order.id}",
            payer_message=f"ReLoop order #{order.id}",
            payee_note=f"Payment for ReLoop order #{order.id}",
        )
    except momo.MomoError as exc:
        raise ValidationError(str(exc))

    payment = MomoPayment.objects.create(
        order=order,
        reference_id=reference_id,
        phone=phone,
        amount=order.total_amount,
        currency=settings.MOMO_CURRENCY,
    )
    if order.payment_status == Order.PaymentStatus.FAILED:
        order.payment_status = Order.PaymentStatus.PENDING
        order.save(update_fields=["payment_status", "updated_at"])
    return payment


@transaction.atomic
def refresh_momo_payment(payment):
    """Ask MTN for the latest status of a pending payment and apply it.

    Safe to call repeatedly (from polling and from the callback): the row is
    locked and only a PENDING payment can change, so an order is marked paid once.
    """
    payment = MomoPayment.objects.select_for_update().select_related("order").get(pk=payment.pk)
    if payment.status != MomoPayment.Status.PENDING:
        return payment

    try:
        data = momo.get_payment_status(payment.reference_id)
    except momo.MomoError:
        return payment  # Keep it pending; the next check will try again.

    mtn_status = str(data.get("status", "")).upper()
    if mtn_status == "SUCCESSFUL":
        try:
            paid_amount = Decimal(str(data.get("amount", payment.amount)))
        except InvalidOperation:
            paid_amount = None
        currency = data.get("currency", payment.currency)
        if paid_amount != payment.amount or currency != payment.currency:
            logger.error("MoMo amount mismatch for %s: got %s %s", payment.reference_id, paid_amount, currency)
            payment.status = MomoPayment.Status.FAILED
            payment.failure_reason = "Amount paid does not match the order total."
        else:
            payment.status = MomoPayment.Status.SUCCESSFUL
            payment.financial_transaction_id = str(data.get("financialTransactionId", ""))[:64]
    elif mtn_status in {"FAILED", "REJECTED", "TIMEOUT", "EXPIRED"}:
        payment.status = MomoPayment.Status.FAILED
        reason = data.get("reason")
        if isinstance(reason, dict):
            reason = reason.get("message") or reason.get("code")
        payment.failure_reason = str(reason or mtn_status.title())[:255]
    else:
        return payment  # Still PENDING.

    payment.save()

    order = payment.order
    if payment.status == MomoPayment.Status.SUCCESSFUL and order.payment_status != Order.PaymentStatus.PAID:
        transition_order_status(order, new_payment_status=Order.PaymentStatus.PAID)
        from apps.notifications.services import notify

        for seller in {item.seller for item in order.items.select_related("seller")}:
            notify(seller, "Payment received", f"Order #{order.id} was paid with MTN Mobile Money.", "ORDER")
    elif payment.status == MomoPayment.Status.FAILED and order.payment_status == Order.PaymentStatus.PENDING:
        order.payment_status = Order.PaymentStatus.FAILED
        order.save(update_fields=["payment_status", "updated_at"])
    return payment
