from django.urls import path
from . import views

urlpatterns = [
    path('create/<int:table_num>/', views.make_order, name="make-order"),                
    path('cancel/<str:order_id>/', views.cancel_order, name="cancel-order"), 
    path('unpaid/<int:table_num>/', views.unpaid_orders_view, name="unpaid-orders"),        
    path('pay/<str:order_id>/', views.pay_order, name="pay-order"),                    
    path('pay-table/', views.pay_table, name="pay-table-orders"),   
    path('<str:order_id>/', views.get_order, name="get-order"),  
    path('remove-item/<str:order_id>/', views.remove_item, name="remove-item-from-order"),         
    path('add-item/<str:order_id>/', views.add_item, name="add-item-to-order"),
]