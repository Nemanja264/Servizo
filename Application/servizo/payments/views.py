from django.views.decorators.csrf import csrf_exempt, csrf_protect
from django.views.decorators.http import require_POST, require_GET
from orders.models import Order
from bson import ObjectId
from django.http import JsonResponse
from django.conf import settings
from .models import Payment, PaymentStatus
import stripe
from helpers.responses import created_response, bad_request, not_found, success
from helpers.utils import parse_json
from decimal import Decimal, ROUND_HALF_UP
from .utils import handle_succeed_payment

stripe.api_key = settings.STRIPE_SECRET_KEY

@require_GET
def stripe_config(_):
    return JsonResponse({"publishableKey": settings.STRIPE_PUBLISHABLE_KEY})

@require_GET
def payment_status(request, pi_id: str):
    try:
        payment = Payment.objects.get(stripe_payment_intent_id=pi_id)
    except Payment.DoesNotExist:
        return not_found("unknown_payment")
    
    return JsonResponse({
        "status": payment.status,
        "receipt_url": payment.receipt_url,
        "reason": payment.error_message
    }, status=200)


@csrf_protect
@require_POST
def create_payment_intent(request):
    body = parse_json(request)
    if body is None:
        return bad_request("Invalid JSON")
    
    order_ids_hex = body.get("order_ids")
    if not isinstance(order_ids_hex, list) or not order_ids_hex:
        return bad_request("order_ids must be a non-empty list")

    order_ids = [ObjectId(hid) for hid in order_ids_hex]
    orders = list(Order.objects.filter(id__in = order_ids))

    total_eur = sum(o.total_price for o in orders)
    total_cents = int((total_eur*Decimal(100)).quantize(Decimal("1"), rounding=ROUND_HALF_UP))

    table_num = orders[0].table_num
    if total_cents <= 0:
        return bad_request("Amount must be over 0")
    
    email = request.user.email.strip() or None

    intent = stripe.PaymentIntent.create(
        currency = settings.STRIPE_CURRENCY,
        amount = total_cents,
        automatic_payment_methods = {"enabled": True},
         metadata={
            "order_ids": ",".join(order_ids_hex),
            "table_num": str(table_num),
        },
        receipt_email=email
    )

    Payment.objects.create(
        table_num=table_num,
        order_ids=order_ids,
        amount_cents=total_cents,
        client_secret=intent.client_secret,
        stripe_payment_intent_id = intent.id,
        payer_email=email
    )

    return created_response(detail="Payment Intent created", id=intent.id, clientSecret = intent.client_secret)

@csrf_exempt
@require_POST
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META. get("HTTP_STRIPE_SIGNATURE", "")

    try:
        event = stripe.Webhook.construct_event(
            payload = payload,
            sig_header = sig_header,
            secret=settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception:
        return bad_request("Webhook failed")
    
    etype = event.get("type")
    payment_intent = event['data']['object']
    pi_id = payment_intent.get("id")
    
    if etype == 'payment_intent.succeeded':
        charges = (payment_intent.get("charges") or {}).get("data") or []
        charge = charges[0] if charges else {}
        receipt_url = charge.get("receipt_url")

        handle_succeed_payment(pi_id, receipt_url)

    elif etype == "payment_intent.payment_failed":
        last_err = payment_intent.get("last_payment_error")
        Payment.objects.filter(stripe_payment_intent_id=pi_id).update(status=PaymentStatus.FAILED, error_message=last_err.get("message"),)

    elif etype == "payment_intent.canceled":
        Payment.objects.filter(stripe_payment_intent_id=pi_id).update(status=PaymentStatus.CANCELED)
    
        
    return success("Stripe has successfully processed the payment")