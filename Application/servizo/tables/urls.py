from django.urls import path
from . import views

urlpatterns = [
    path('add/<int:table_number>/', views.add_table, name="add-table"),
    path('add_next_table/', views.add_next_table, name="add-next-table"),
    path('', views.get_tables, name="get-tables"),
    path('delete/<int:table_number>/', views.remove_table, name="remove-table"),
    path('<int:table_number>/', views.get_table, name="get-table"),
]
