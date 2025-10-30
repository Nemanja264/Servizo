from .models import Payment
from django.utils import timezone
from orders.models import Order
from .models import PaymentStatus

def handle_succeed_payment(pi_id, receipt_url):
    payment = Payment.objects.get(stripe_payment_intent_id=pi_id)
        
    if payment.paid_at is not None:
        return
    
    at = timezone.now()
    payment.paid_at = at
    payment.status = PaymentStatus.SUCCEEDED
    fields = ["paid_at", "status"]
    
    if receipt_url:
        payment.receipt_url = receipt_url
        fields.append("receipt_url")

    payment.save(update_fields=fields)

    orders = Order.objects.filter(id__in=payment.order_ids)
    for order in orders:
        order.pay(at=at)