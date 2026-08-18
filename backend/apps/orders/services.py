from django.db import transaction
from rest_framework.exceptions import ValidationError

from apps.products.models import Product

from .models import Cart, Order, OrderItem


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
