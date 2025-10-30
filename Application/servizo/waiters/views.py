from django.shortcuts import render
from django.views.decorators.http import require_POST, require_GET
from .models import Waiter
from django.utils import timezone
from helpers.responses import success, unauthorized, not_found
from django.views.decorators.csrf import csrf_protect



# Create your views here.
@csrf_protect
@require_POST
def log_start_of_shift(request):
    u = request.user
    if not u.is_authenticated:
        return unauthorized("Login required.")

    try:
        waiter = Waiter.objects.get(id=u.id)
    except Waiter.DoesNotExist:
        return not_found("Waiter profile not found.")
    
    waiter.start_time = timezone.now()
    waiter.save(update_fields=["start_time"])

    return success("Shift start time has been logged")


@csrf_protect
@require_POST
def log_end_of_shift(request):
    u = request.user
    if not u.is_authenticated:
        return unauthorized("Login required.")

    try:
        waiter = Waiter.objects.get(id=u.id)
    except Waiter.DoesNotExist:
        return not_found("Waiter profile not found.")
    
    waiter.end_time = timezone.now()
    waiter.save(update_fields=["end_time"])

    return success("Shift end time has been logged")
