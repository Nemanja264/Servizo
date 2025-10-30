from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from .models import Order
from tables.utils import calc_table_due

@receiver([post_save, post_delete], sender=Order)
def update_table_due(sender, instance, **kwargs):
    calc_table_due(instance.table_num)
