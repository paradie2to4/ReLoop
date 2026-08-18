"""
Django settings for the ReLoop backend.

Configuration is driven entirely by environment variables (see .env.example)
so the same codebase runs locally (SQLite/Postgres) and in production on
Render + Neon Postgres + Cloudinary, without code changes.
"""

from datetime import timedelta
from pathlib import Path

import dj_database_url
from decouple import Csv, config

BASE_DIR = Path(__file__).resolve().parent.parent

# --- Core ---------------------------------------------------------------

SECRET_KEY = config("SECRET_KEY", default="dev-insecure-secret-key-change-me")
DEBUG = config("DEBUG", default=False, cast=bool)
ALLOWED_HOSTS = config("ALLOWED_HOSTS", default="localhost,127.0.0.1", cast=Csv())

# Render provides its external hostname at runtime; trust it automatically.
RENDER_EXTERNAL_HOSTNAME = config("RENDER_EXTERNAL_HOSTNAME", default="")
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)

# Vercel provides its deployment hostname at runtime; trust it automatically.
VERCEL_URL = config("VERCEL_URL", default="")
if VERCEL_URL:
    ALLOWED_HOSTS.append(VERCEL_URL)

# --- Applications ---------------------------------------------------------

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "cloudinary_storage",
    "cloudinary",
]

LOCAL_APPS = [
    "apps.accounts",
    "apps.products",
    "apps.orders",
    "apps.exchanges",
    "apps.donations",
    "apps.repairs",
    "apps.messaging",
    "apps.reviews",
    "apps.notifications",
    "apps.impact",
    "apps.reports",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

AUTH_USER_MODEL = "accounts.User"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# --- Database -------------------------------------------------------------
# Falls back to local SQLite only if DATABASE_URL is not set, so the project
# can be cloned and run with zero external services for a quick look.

DATABASE_URL = config("DATABASE_URL", default="")
if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL, conn_max_age=600, ssl_require=not DEBUG
        )
    }
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# --- Password validation ---------------------------------------------------

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# --- I18N -------------------------------------------------------------------

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Africa/Kigali"
USE_I18N = True
USE_TZ = True

# --- Static & media ----------------------------------------------------------

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

CLOUDINARY_STORAGE = {
    "CLOUD_NAME": config("CLOUDINARY_CLOUD_NAME", default=""),
    "API_KEY": config("CLOUDINARY_API_KEY", default=""),
    "API_SECRET": config("CLOUDINARY_API_SECRET", default=""),
}

# Cloudinary is used whenever credentials are configured (always in production).
# Without credentials, uploads fall back to local disk so local development
# doesn't require a Cloudinary account to see product images.
USE_CLOUDINARY = bool(CLOUDINARY_STORAGE["CLOUD_NAME"])

STORAGES = {
    "default": {
        "BACKEND": (
            "cloudinary_storage.storage.MediaCloudinaryStorage"
            if USE_CLOUDINARY
            else "django.core.files.storage.FileSystemStorage"
        ),
    },
    "staticfiles": {
        # Non-manifest: Vercel builds the static assets and the Python
        # function in separate steps that don't share a filesystem, so a
        # hashed-manifest storage (whose staticfiles.json lives only in the
        # static build output) would break `{% static %}` lookups (e.g. in
        # /admin/) at runtime. Plain compression still applies.
        "BACKEND": "whitenoise.storage.CompressedStaticFilesStorage",
    },
}

# Image upload validation (enforced in apps/products/serializers.py)
MAX_IMAGE_SIZE_MB = 5
ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# --- REST framework ----------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "rest_framework.pagination.PageNumberPagination",
    "PAGE_SIZE": 12,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DATETIME_FORMAT": "iso-8601",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=config("ACCESS_TOKEN_LIFETIME_MIN", default=60, cast=int)),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=config("REFRESH_TOKEN_LIFETIME_DAYS", default=7, cast=int)),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": False,
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "ReLoop API",
    "DESCRIPTION": "REST API for ReLoop — a circular marketplace for reuse, resale, exchange, donation and repair.",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}

# --- CORS ----------------------------------------------------------------

CORS_ALLOWED_ORIGINS = config("CORS_ALLOWED_ORIGINS", default="http://localhost:5173", cast=Csv())
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = config("CSRF_TRUSTED_ORIGINS", default="", cast=Csv())

# --- Security (production) --------------------------------------------------

if not DEBUG:
    SECURE_SSL_REDIRECT = config("SECURE_SSL_REDIRECT", default=True, cast=bool)
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

# --- ReLoop domain config ----------------------------------------------------
# Editable, non-scientific estimates used by the impact calculation service.
# category name -> (avg kg saved per item, kg CO2 saved per item)
IMPACT_DEFAULT_CATEGORY_WEIGHTS = {
    "Electronics": (4.5, 25.0),
    "Phones": (0.3, 12.0),
    "Computers": (3.0, 20.0),
    "Furniture": (18.0, 15.0),
    "Clothing": (0.5, 3.5),
    "Shoes": (0.8, 4.0),
    "Books": (0.3, 1.0),
    "Home Appliances": (12.0, 18.0),
    "Kitchen": (1.5, 4.0),
    "Sports": (1.2, 3.0),
    "Baby Items": (1.0, 2.5),
    "Vehicles": (120.0, 90.0),
    "Accessories": (0.3, 1.5),
    "Other": (1.0, 2.0),
}
