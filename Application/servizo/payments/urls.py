from django.urls import path
from . import views

urlpatterns = [
    path("config/", views.stripe_config, name="stripe-config"),
    path("create-intent/", views.create_payment_intent, name="create-stripe-intent"),
    path("webhook/", views.stripe_webhook, name="stripe-webhook"),
    path("status/<str:pi_id>/", views.payment_status, name="payment-status")
]
