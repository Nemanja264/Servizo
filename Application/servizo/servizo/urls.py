"""
URL configuration for servizo project.
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.utils.text import slugify
from django.shortcuts import redirect
from . import views

BAR_NAME = slugify(settings.DATABASES['default']['NAME'])

def admin_redirect(_request):
    return redirect(f'/{BAR_NAME}/admin/', permanent=True)

urlpatterns = [
    # Admin pod /<db-slug>/admin/ i preusmerenje sa /admin/
    path(f'{BAR_NAME}/admin/', admin.site.urls),
    path('admin/', admin_redirect),

    path('api/orders/', include('orders.urls')),
    path('api/menu/', include('menu.urls')),
    path('api/tables/', include('tables.urls')),
    path('api/payments/', include('payments.urls')),

    
    # ⬇️ Mount-ujemo accounts.urls na root,
    # pa će npr. /api/auth/login/ raditi kako front očekuje
    path('', include('accounts.urls')),

    # SPA fallback: sve što NIJE api|admin|static|media ide na React index.html
    re_path(r"^(?!api|admin|static|media).*", views.spa_view),
]
