"""
Django settings for servizo project.
"""
import os
from pathlib import Path
from dotenv import load_dotenv
import django_mongodb_backend # pyright: ignore[reportMissingImports]

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv()

STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_CURRENCY = os.getenv("STRIPE_CURRENCY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

SECRET_KEY = 'django-insecure-72)w%2cvexy-(cx8rkqt5$p2_f+0w5_sqxlshx-8jx9(n_gkxu'
DEBUG = True
ALLOWED_HOSTS = ["127.0.0.1", "localhost"]

EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "True") == "True"
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", EMAIL_HOST_USER)

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

INSTALLED_APPS = [
    "corsheaders",

    "servizo.apps.MongoAdminConfig",
    "servizo.apps.MongoAuthConfig",
    "servizo.apps.MongoContentTypesConfig",

    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    "django_mongodb_backend",

    "menu",
    "frontend",
    "orders",
    "tables",
    "accounts",
    "payments",
    "waiters",
]

AUTH_USER_MODEL = "accounts.User"
LOGIN_REDIRECT_URL = "/"
LOGOUT_REDIRECT_URL = "/"
LOGIN_URL = "/login"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "servizo.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "servizo.wsgi.application"

uri = os.getenv("MONGO_URI")
DATABASES = {
    "default": django_mongodb_backend.parse_uri(uri, db_name="MasaBar"),
}
DATABASE_ROUTERS = ["django_mongodb_backend.routers.MongoRouter"]



AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATICFILES_DIRS = [BASE_DIR / "frontend" / "static"]  # React build ovde
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django_mongodb_backend.fields.ObjectIdAutoField"
MIGRATION_MODULES = {
    "admin": "mongo_migrations.admin",
    "auth": "mongo_migrations.auth",
    "contenttypes": "mongo_migrations.contenttypes",
}

# === Sessions / CSRF / CORS ===
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]
CSRF_TRUSTED_ORIGINS = [
    "http://127.0.0.1:5173",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
]

X_FRAME_OPTIONS = "DENY"
