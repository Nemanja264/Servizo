from django.urls import path
from . import views

urlpatterns = [
    path("log-shift/start", views.log_start_of_shift, name="shift-start"),
    path("log-shift/end", views.log_end_of_shift, name="shift-end")
]
