# accounts/admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("username", "email", "role", "is_staff", "is_active", "last_login")
    list_filter  = ("role", "is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email")
    ordering = ("username",)

    fieldsets = UserAdmin.fieldsets + (
        ("Servizo Extras", {"fields": ("role", "favorites")}),
    )
