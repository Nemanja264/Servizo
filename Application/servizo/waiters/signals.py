from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from accounts.models import User, Role
from .models import Waiter

@receiver(post_save, sender=User)
def sync_waiter_doc_on_save(sender, instance: User, **kwargs):
    if instance.role == Role.WAITER:
        Waiter.objects.get_or_create(id=instance.id)
    else:
        Waiter.objects.filter(id=instance.id).delete()

@receiver(post_delete, sender=User)
def delete_waiter_on_user_delete(sender, instance: User, **kwargs):
    Waiter.objects.filter(id=instance.id).delete()
