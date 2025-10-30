from django.db import models
from bson import ObjectId
from accounts.models import User, Role
from django.core.exceptions import ValidationError
from django_mongodb_backend.fields import ObjectIdField, ArrayField # pyright: ignore[reportMissingImports]

# Create your models here.
class Waiter(models.Model):
    id = ObjectIdField(primary_key=True, db_column="_id")
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "waiters"

    def clean(self):
        try:
            u = User.objects.get(id=self.id)
        except User.DoesNotExist:
            raise ValidationError("User does not exist.")
        
        if u.role != Role.WAITER:
            raise ValidationError("Linked user must have role=waiter.")
