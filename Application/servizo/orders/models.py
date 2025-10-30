from django.db import models
from decimal import Decimal
from django_mongodb_backend.fields import ObjectIdField
from django_mongodb_backend.fields import ArrayField
from django.utils import timezone
from bson import ObjectId
from collections import Counter
from menu.models import MenuItem


class OrderStatus(models.TextChoices):
    NEW = "new", "New"
    PREPARING = "preparing", "Preparing"
    SERVED = "served", "Served"
    PAID = "paid", "Paid"
    CANCELLED = "cancelled", "Cancelled"

# Create your models here.
class Order(models.Model):
    id = ObjectIdField(primary_key=True, default=ObjectId, db_column="_id")
    items = ArrayField(ObjectIdField(), default=list, null=False)
    table_num = models.IntegerField()
    total_price = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"), editable=False)
    ordered_at = models.DateTimeField(auto_now_add=True, editable=False)
    status = models.CharField(max_length=20, default=OrderStatus.NEW, choices=OrderStatus.choices)
    paid_at = models.DateTimeField(editable=False, null=True, blank=True)

    def pay(self, at=None):
        if self.status == OrderStatus.PAID:
            return False
        
        self.status = OrderStatus.PAID
        self.paid_at = at or timezone.now()

        self.save(update_fields=['status', 'paid_at'])
        return True

    def prepare(self):
        self.status = OrderStatus.PREPARING

        self.save(update_fields=['status'])
    
    def served(self):
        self.status = OrderStatus.SERVED

        self.save(update_fields=['status'])
    
    def cancel(self):
        self.status = OrderStatus.CANCELLED

        self.save(update_fields=['status'])

    @staticmethod
    def unpaid_for_table(table_num: int):
        return Order.objects.filter(
            table_num=table_num,
            status__in=[OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.SERVED]
        )
    
    def get_order_items(self):
        return MenuItem.objects.filter(
            id__in=self.items
        )
    
    def save(self, *args, **kwargs):
        from menu.models import MenuItem

        counts = Counter(self.items)

        all_items = MenuItem.objects.filter(id__in=counts.keys())

        total = sum((item.price*counts[item.id] for item in all_items), Decimal("0.00"))

        self.total_price = total

        super().save(*args, **kwargs)

    class Meta:
        db_table = "orders"
        managed = False

    def __str__(self):
        return f"Order {self.id} Table number {self.table_num}"