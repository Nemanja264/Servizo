from django.db import models
from django.contrib.auth.models import AbstractUser
from django_mongodb_backend.fields import ObjectIdField
from django_mongodb_backend.fields import ArrayField
from bson import ObjectId

class Role(models.TextChoices):
    ADMIN = "admin", "Admin"
    MANAGER = "manager", "Manager"
    WAITER = "waiter", "Waiter"
    CUSTOMER = "customer", "Customer"

# Create your models here.
class User(AbstractUser):
    id = ObjectIdField(primary_key=True, default=ObjectId, db_column="_id")
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.CUSTOMER, db_index=True)
    favorites = ArrayField(base_field=ObjectIdField(), default=list, blank=True)

    class Meta:
        # Important: keep the same collection/table name so existing documents are used
        db_table = "auth_user"

    @staticmethod
    def _to_oid(value):
        if isinstance(value, ObjectId):
            return value
        return ObjectId(str(value))

    def add_favorite(self, menu_item_id):
        oid = self._to_oid(menu_item_id)

        if menu_item_id not in self.favorites:
            self.favorites.append(menu_item_id)
            self.save(update_fields=["favorites"])

    def remove_favorite(self, menu_item_id):
        oid = self._to_oid(menu_item_id)

        if menu_item_id in self.favorites:
            self.favorites.remove(menu_item_id)
            self.save(update_fields=["favorites"])