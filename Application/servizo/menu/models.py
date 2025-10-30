from django.db import models
from django_mongodb_backend.fields import ObjectIdField
from django_mongodb_backend.fields import ArrayField
from functools import cached_property
from bson import ObjectId

# Create your models here.
class MenuCategory(models.Model):
    id = ObjectIdField(primary_key=True, default=ObjectId, db_column="_id")

    name = models.CharField(max_length=20, db_index=True)
    parent = ObjectIdField(null=True, blank=True)
    path = models.CharField(max_length=150, editable=False)
    ancestors = ArrayField(ObjectIdField(), size=8, blank=True, default=list, editable=False)

    @cached_property
    def descendants(self):
        return MenuCategory.objects.filter(ancestors=self.id)
    
    @property
    def parent_path(self):
        if self.parent is None:
            return None
        else:
            return MenuCategory.objects.filter(id=self.parent).path
    
    def save(self, *args, **kwargs):
        if self.parent:
            parent = MenuCategory.objects.get(id=self.parent)

            self.ancestors = parent.ancestors + [parent.id]
            self.path = f"{parent.path}/{self.name}"
        else:
            self.ancestors = []
            self.path = self.name
        
        super().save(*args, **kwargs)

    class Meta:
        db_table = "menu_categories"
        managed = False

    def __str__(self):
        return self.name
    

class MenuItem(models.Model):
    id = ObjectIdField(primary_key=True, default=ObjectId, db_column="_id")

    name = models.CharField(max_length=50, db_index=True)
    category_id = ObjectIdField(null=False)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    available = models.BooleanField(default=True)
    description = models.TextField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True, editable=False)

    @cached_property
    def category_name(self):
        category = MenuCategory.objects.get(id=self.category_id)
        return category.name
    
    @cached_property
    def category(self):
        return MenuCategory.objects.get(id=self.category_id)

    class Meta:
        db_table = "menu_items"
        managed = False

    def __str__(self):
        return self.name