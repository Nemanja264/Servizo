from django.urls import path
from . import views

urlpatterns = [
    path('categories/', views.get_categories, name="get-categories"),
    path('categories/add/', views.add_category, name="add-category"),
    path('categories/<str:category_id>/update/', views.update_category, name="update-category"),
    path('categories/<str:category_id>/delete/', views.remove_category, name="delete-category"),

    # lista svih stavki menija
    path('items/', views.get_menu_items, name="get-menu-items"),
    path('items/add/', views.add_menu_item, name="add-menu-item"),
    path('items/by-category/<str:category_id>/', views.get_items_by_category, name="get-category-items"),
    path('items/<str:item_id>/update/', views.update_item, name="update-menu-item"),
    path('items/<str:item_id>/price/', views.update_price, name="update-item-price"),
    path('items/<str:item_id>/delete/', views.remove_item, name="delete-menu-item"),
]
