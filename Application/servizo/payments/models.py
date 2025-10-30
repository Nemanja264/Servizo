from django.db import models
from django_mongodb_backend.fields import ObjectIdAutoField, ObjectIdField, ArrayField # pyright: ignore[reportMissingImports]
from bson import ObjectId


class PaymentStatus(models.TextChoices):
    CREATED          = "created", "Created"
    REQUIRES_ACTION  = "requires_action", "Requires action"
    PROCESSING       = "processing", "Processing"
    SUCCEEDED        = "succeeded", "Succeeded"
    FAILED           = "failed", "Failed"
    CANCELED         = "canceled", "Canceled"
# Create your models here.
class Payment(models.Model):
    id = ObjectIdAutoField(primary_key=True)
   
    table_num = models.IntegerField(null=True, blank=True)
    amount_cents = models.IntegerField()
    currency = models.CharField(max_length=10, default="eur")

    order_ids = ArrayField(ObjectIdField(), default=list, null=False)

    stripe_payment_intent_id = models.CharField(max_length=255, unique=True)
    client_secret = models.CharField(max_length=255)
    receipt_url = models.URLField(null=True, blank=True)

    payer_email = models.EmailField(null=True, blank=True, db_index=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 
    paid_at = models.DateTimeField(null=True, blank=True)

    status = models.CharField(max_length=20, default=PaymentStatus.CREATED, choices=PaymentStatus.choices, db_index=True)
    error_message = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = "payments"
        indexes = [
            models.Index(fields=["stripe_payment_intent_id"]),
            models.Index(fields=["table_num"]),
            models.Index(fields=["paid_at"]),
            models.Index(fields=["created_at"]),
        ]

    def __str__(self):
        return f"Payment {self.id} Table number {self.table_num}"