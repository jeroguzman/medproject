"""Environment-driven settings; no clinical data or credentials in logs."""

import os
import sys
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlsplit

import dj_database_url
from django.core.exceptions import ImproperlyConfigured

BASE_DIR = Path(__file__).resolve().parent.parent
# El mismo contrato de Luis se usa desde Django y en la imagen de producción.
sys.path.insert(0, str(BASE_DIR.parent / "ia"))
DEBUG = os.environ.get("DEBUG", "false").lower() == "true"
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")
if len(SECRET_KEY) < 32:
    raise ImproperlyConfigured(
        "Configura DJANGO_SECRET_KEY con al menos 32 caracteres."
    )


def csv_env(name):
    return [
        value.strip() for value in os.environ.get(name, "").split(",") if value.strip()
    ]


ALLOWED_HOSTS = csv_env("ALLOWED_HOSTS")
INSTALLED_APPS = [
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "django.contrib.postgres",
    "rest_framework",
    "corsheaders",
    "cuentas",
    "pacientes",
    "notas",
    "ia_api",
]
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
ROOT_URLCONF = "medvox.urls"
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
            ]
        },
    }
]
WSGI_APPLICATION = "medvox.wsgi.application"
if not os.environ.get("DATABASE_URL"):
    raise ImproperlyConfigured("Configura DATABASE_URL de PostgreSQL.")
DATABASES = {
    "default": dj_database_url.config(conn_max_age=60, conn_health_checks=True)
}
if DATABASES["default"]["ENGINE"] != "django.db.backends.postgresql":
    raise ImproperlyConfigured("Este backend requiere PostgreSQL.")
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework_simplejwt.authentication.JWTAuthentication"
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticated",
        "cuentas.permissions.EsMedico",
    ],
    "EXCEPTION_HANDLER": "medvox.exceptions.api_exception_handler",
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.ScopedRateThrottle"],
    "DEFAULT_THROTTLE_RATES": {
        "login": "30/minute",
        "mojoauth_start": "10/minute",
        "mojoauth_verify": "30/minute",
        "mojoauth_social_start": "20/minute",
        "mojoauth_social_verify": "30/minute",
        "ia_procesar": "20/minute",
    },
}
SIMPLE_JWT = {"ACCESS_TOKEN_LIFETIME": timedelta(hours=12)}
CORS_ALLOWED_ORIGINS = csv_env("CORS_ALLOWED_ORIGINS")
CORS_ALLOW_ALL_ORIGINS = False
APPEND_SLASH = False
LANGUAGE_CODE = "es-mx"
TIME_ZONE = "America/Mexico_City"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
SECURE_SSL_REDIRECT = not DEBUG
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = not DEBUG
SECURE_HSTS_PRELOAD = not DEBUG
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = "DENY"
# Only headers/status are logged. Do not add request bodies, JWT or clinical content.
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "handlers": {"null": {"class": "logging.NullHandler"}},
    "loggers": {
        "django.request": {"handlers": ["null"], "propagate": False},
        "django.server": {"handlers": ["null"], "propagate": False},
        "django.security.DisallowedHost": {"handlers": ["null"], "propagate": False},
    },
}

TEST_RUNNER = "tests.runner.NonEmptyDiscoverRunner"

# Enable only behind a trusted TLS proxy; the production backend has no host port.
SECURE_PROXY_SSL_HEADER = (
    ("HTTP_X_FORWARDED_PROTO", "https")
    if os.environ.get("DJANGO_TRUST_PROXY_HEADERS", "false").lower() == "true"
    else None
)
# /api/salud remains authenticated. Only this infrastructure endpoint is public.
SECURE_REDIRECT_EXEMPT = [r"^healthz$"]


AUTH_PROVIDER = os.environ.get("AUTH_PROVIDER", "password").lower()
if AUTH_PROVIDER not in ("password", "mojoauth"):
    raise ImproperlyConfigured("AUTH_PROVIDER debe ser password o mojoauth.")
MOJOAUTH_API_KEY = os.environ.get("MOJOAUTH_API_KEY", "")
MOJOAUTH_API_SECRET = os.environ.get("MOJOAUTH_API_SECRET", "")
if AUTH_PROVIDER == "mojoauth" and not MOJOAUTH_API_KEY:
    raise ImproperlyConfigured(
        "Configura MOJOAUTH_API_KEY para habilitar el acceso por correo."
    )
# Acceso con Google o Facebook mediante MojoAuth. La URL de regreso la fija el
# servidor (nunca el navegador) y debe estar autorizada en el proyecto de MojoAuth.
MOJOAUTH_SOCIAL_PROVIDERS = [p.lower() for p in csv_env("MOJOAUTH_SOCIAL_PROVIDERS")]
if set(MOJOAUTH_SOCIAL_PROVIDERS) - {"google", "facebook"}:
    raise ImproperlyConfigured("MOJOAUTH_SOCIAL_PROVIDERS admite google y facebook.")
MOJOAUTH_REDIRECT_URL = os.environ.get("MOJOAUTH_REDIRECT_URL", "").strip()
_regreso = urlsplit(MOJOAUTH_REDIRECT_URL)
if MOJOAUTH_REDIRECT_URL and (
    _regreso.scheme not in (("https", "http") if DEBUG else ("https",))
    or not _regreso.hostname
    or _regreso.username
    or _regreso.query
    or _regreso.fragment
):
    raise ImproperlyConfigured(
        "MOJOAUTH_REDIRECT_URL debe ser una URL HTTPS sin query ni fragmento."
    )


# Procesamiento de audio (docs/equipo/jeroben-backend.md §10). eco: ejemplo fijo;
# n8n: workflow WF-1; django: ElevenLabs y Backboard directamente (plan C).
IA_ORQUESTADOR = os.environ.get("IA_ORQUESTADOR", "eco").strip().lower()
if IA_ORQUESTADOR not in ("eco", "n8n", "django"):
    raise ImproperlyConfigured("IA_ORQUESTADOR debe ser eco, n8n o django.")
N8N_BASE_URL = os.environ.get("N8N_BASE_URL", "").strip().rstrip("/")
N8N_SECRET = os.environ.get("N8N_SECRET", "").strip()
IA_TIMEOUT_S = 170
IA_ECO_ESPERA_S = 3
IA_AUDIO_MAX_BYTES = 50 * 1024 * 1024
# El audio se procesa en memoria y nunca se escribe en disco ni en la base (D-02).
FILE_UPLOAD_MAX_MEMORY_SIZE = IA_AUDIO_MAX_BYTES + 1024 * 1024
