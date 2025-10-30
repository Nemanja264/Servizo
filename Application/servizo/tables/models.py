from django.db import models
from django_mongodb_backend.fields import ObjectIdField
from bson import ObjectId
from decimal import Decimal
from orders.models import Order
from orders.models import OrderStatus

# Create your models here.


class Table(models.Model):
    id = ObjectIdField(primary_key=True, default=ObjectId, db_column="_id")
    table_number = models.IntegerField(editable=False)
    amount_due = models.DecimalField(
        max_digits=10, decimal_places=2, default=Decimal("0.00"), editable=False)

    @property
    def all_orders(self):
        return Order.objects.filter(table_num=self.table_number)

    @property
    def new_orders(self):
        return Order.objects.filter(table_num=self.table_number, status=OrderStatus.NEW)

    @property
    def unpaid_orders(self):
        return Order.objects.filter(table_num=self.table_number, status__in=[OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.SERVED])

    @property
    def paid_orders(self):
        return Order.objects.filter(table_num=self.table_number, status=OrderStatus.PAID)

    def pay_all_orders(self):
        unpaid = self.unpaid_orders
        count = unpaid.count()
        if count == 0:
            return 0

        for order in unpaid:
            order.pay()

        return count

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

    class Meta:
        db_table = "tables"
        managed = False

    def __str__(self):
        return f"Table {self.table_number}"
