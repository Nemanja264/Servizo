from django.urls import path
from . import views

urlpatterns = [
    # Auth / Session
    path("api/auth/csrf/", views.csrf_view),
    path("api/auth/login/", views.login_view, name="login"),
    path("api/auth/logout/", views.logout_view, name="logout"),
    path("api/auth/register/", views.register_view, name="register"),
    path("api/auth/whoami/", views.whoami_view, name="whoami"),
    path("api/auth/reset-password/", views.reset_password, name="reset-password"),

    path("api/auth/password-reset/request/", views.request_password_reset, name="password-reset-request"),
    path("api/auth/password-reset/confirm/", views.confirm_password_reset, name="password-reset-confirm"),



    # User
    path("api/user/profile/", views.myprofile),
    path("api/user/favorites/", views.my_favorites),
    path("api/user/favorites/add/<str:menu_item_id>/", views.add_to_favorites, name="add-favorite"),
    path("api/user/favorites/remove/<str:menu_item_id>/", views.remove_from_favorites, name="remove-favorite"),
    path("api/user/change-first-name/", views.change_first_name),
    path("api/user/change-last-name/", views.change_last_name),
    path("api/user/change-username/", views.change_username),
    path("api/user/change-email/", views.change_email),
]
