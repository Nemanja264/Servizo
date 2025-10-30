from functools import wraps

from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET, require_safe, require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.contrib.auth import authenticate, login as dj_login, logout as dj_logout
from django.contrib.auth import get_user_model
from helpers.responses import bad_request, created_response, unauthorized, success
from helpers.utils import parse_json
from bson import ObjectId
from bson.errors import InvalidId
from .utils import resolve_username, get_user_by_identifier
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from django.conf import settings
from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes

from menu.models import MenuItem

User = get_user_model()

def require_auth(view_func):
    @wraps(view_func)
    def _wrapped(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return unauthorized()
        return view_func(request, *args, **kwargs)
    return _wrapped

@ensure_csrf_cookie
@require_GET
def csrf_view(_req):
    return JsonResponse({"detail": "CSRF cookie set"})

@csrf_protect
@require_POST
def login_view(request):
    t = request.GET.get("table")
    if t and t.isdigit():
        request.session["table_num"] = int(t)
    try:
        body = parse_json(request)
        if body is None:
            return bad_request("Invalid JSON")
        
        identifier = (body.get("identifier") or "").strip()

        password = (body.get("password") or "").strip()

        if not identifier or not password:
            return bad_request("Username/Email and Password required")

        
        username = resolve_username(identifier)
        if not username:
            return unauthorized("Invalid Email!")

        user = authenticate(request, username=username, password=password)
        if user is None:
            return unauthorized("Invalid credentials!")

        dj_login(request, user)
        return JsonResponse({"username": user.username, "email": user.email, "table_num": request.session.get("table_num")})
    except Exception as e:
       
        return bad_request(str(e))


@csrf_protect
@require_POST
def register_view(request):
    body = parse_json(request)
    if body is None:
        return bad_request("Invalid JSON")

    username = body.get("username")
    password = body.get("password")
    email    = (body.get("email") or "").strip().lower()

    if not username or not password or not email:
        return bad_request("Username, password and email are required!")

    if User.objects.filter(username=username).exists():
        return bad_request("Username already taken.")

    if User.objects.filter(email=email).exists():
      return bad_request("Email already in use.")
    
    User.objects.create_user(
        username=username,
        password=password,
        email=email,                                  
    )
    return created_response("User Created!")

@csrf_protect
@require_POST
def logout_view(request):
    request.session.pop("table_num", None)
    dj_logout(request)
    return JsonResponse({"detail": "Logged out"})



@csrf_protect
@require_POST
def reset_password(request):
    body = parse_json(request)
    if body is None:
        return bad_request("Invalid JSON")
    
    identifier = (body.get("identifier") or "").strip()
    new_password = (body.get("new_password") or "").strip()

    
    if not identifier or not new_password:
        return bad_request("Username/Email and New_Password required")
    
    user = get_user_by_identifier(identifier)
    if not user:
        return unauthorized("Invalid Username or Email!")
    
    user.set_password(new_password)
    user.save()

    return success("Password updated successfully.")

@csrf_protect
@require_POST
def request_password_reset(request):
    data = parse_json(request)
    if not data:
        return bad_request("invalid_json")
    
    email = (data.get("email") or "").strip().lower()
    if not email:
        return bad_request("Email required")
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return success("If an account exists, a reset email was sent.")
    
    uidb64 = urlsafe_base64_encode(force_bytes(str(user.pk)))
    token = default_token_generator.make_token(user)

    reset_url = f"{settings.FRONTEND_ORIGIN}/reset-password?uid={uidb64}&token={token}"
    subject = "Reset your password"
    message = f"Hello {user.get_username()},\n\nUse the link below to reset your password:\n{reset_url}\n\nIf you didn’t request this, you can ignore this email."

    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [email], fail_silently=False)
    return success("If an account exists, a reset email was sent.")

@csrf_protect
@require_POST
def confirm_password_reset(request):
    data = parse_json(request)
    if not data:
        return bad_request("invalid_json")
    
    uidb64 = data.get("uid")
    token = data.get("token")
    new_password = data.get("new_password")

    if not uidb64 or not token or not new_password:
        return bad_request("Fields are missing")
    
    try:
        uid_str = urlsafe_base64_decode(uidb64).decode()
        user = User.objects.get(pk=ObjectId(uid_str))
    except Exception:
        return bad_request("Invalid link")
    
    if not default_token_generator.check_token(user, token):
        return bad_request("invalid or expired_token")
    
    user.set_password(new_password)
    user.save(update_fields=["password"])
    return success("Password has been reset successfully")

@require_safe
@require_auth
def whoami_view(request):
    u = request.user
    return JsonResponse({
        "username": u.username,
        "role": getattr(u, "role", None),
        "first_name": u.first_name,
        "last_name": u.last_name,
        "email": u.email,
        "table_num": request.session.get("table_num"),
    })


@require_auth
@csrf_protect
@require_POST
def change_first_name(request):
    body = parse_json(request)
    if body is None:
        return bad_request("Invalid JSON")
    
    new_first_name = str((body.get("new_first_name") or "")).strip()
    if not new_first_name:
        return bad_request("First name required")
    
    u = request.user
    if u.first_name == new_first_name:
        return success("No changes.")
    
    u.first_name = new_first_name
    u.save(update_fields=["first_name"])
    return success(f"First name updated to {u.first_name}.")


@require_auth
@csrf_protect
@require_POST
def change_last_name(request):
    body = parse_json(request)
    if body is None:
        return bad_request("Invalid JSON")
    
    new_last_name = str((body.get("new_last_name") or "")).strip()
    if not new_last_name:
        return bad_request("Last name required")
    
    u = request.user
    if u.last_name == new_last_name:
        return success("No changes.")
    
    u.last_name = new_last_name
    u.save(update_fields=["last_name"])
    return success(f"Last name updated to {u.last_name}.")


@require_auth
@csrf_protect
@require_POST
def change_email(request):
    body = parse_json(request)
    if body is None:
        return bad_request("Invalid JSON")
    
    new_email = str((body.get("new_email") or "")).strip().lower()
    if not new_email:
        return bad_request("Email required")
    
    try:
        validate_email(new_email)
    except ValidationError:
        return bad_request("Invalid email format")

    u = request.user
    if u.email == new_email:
        return success("No changes.")
    
    if User.objects.filter(email__iexact=new_email).exists():
        return bad_request("Email already in use")
    
    u.email = new_email
    u.save(update_fields=["email"])
    return success(f"Email updated to {u.email}.")

@require_auth
@csrf_protect
@require_POST
def change_username(request):
    body = parse_json(request)
    if body is None:
        return bad_request("Invalid JSON")
    
    new_username = str((body.get("new_username") or "")).strip()
    if not new_username:
        return bad_request("New username required")
    
    u = request.user
    if u.username == new_username:
        return success("No changes.")
    
    if User.objects.filter(username=new_username).exists():
        return bad_request("Username already in use")
    

    u.username = new_username
    u.save(update_fields=["username"])
    return success(f"Username updated to {u.username}.")


@require_auth
@require_GET
def myprofile(request):
    return JsonResponse({
        "username": request.user.username,
        "role": getattr(request.user, "role", None),
        "email": request.user.email,
    })

@require_auth
@require_GET
def my_favorites(request):
    fav_ids = getattr(request.user, "favorites", []) or []
    items = MenuItem.objects.filter(id__in=fav_ids)
    data = [
        {
            "id": str(item.id),
            "name": item.name,
            "category": item.category_name,
            "price": str(item.price),
            "description": item.description,
            "available": item.available
        }
        for item in items
    ]
    return JsonResponse({"favorites": data})

@require_auth
@csrf_protect
@require_POST
def add_to_favorites(request, menu_item_id: str):
    try:
        menu_item_id = ObjectId(menu_item_id)
    except InvalidId:
        return bad_request("Invalid menu item id")
    
    u = request.user
    if  menu_item_id not in u.favorites:
        u.favorites.append(menu_item_id)
        u.save(update_fields=["favorites"])

    return success(f"Favorite {menu_item_id} added")
    

@require_auth
@csrf_protect
@require_http_methods(["DELETE"])
def remove_from_favorites(request, menu_item_id: str):
    try:
        menu_item_id = ObjectId(menu_item_id)
    except InvalidId:
        return bad_request("Invalid menu item id")
    
    u = request.user
    if  menu_item_id not in u.favorites:
        return success(f"{menu_item_id} is already removed from favorites.")
    else:
        u.favorites.remove(menu_item_id)
        u.save(update_fields=['favorites'])
        return success(f"Favorite {menu_item_id} removed")