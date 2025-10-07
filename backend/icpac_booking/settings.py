"""
Django settings for ICPAC Booking System
"""

from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

from django.core.exceptions import ImproperlyConfigured

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / '.env')


def get_env_list(var_name, default):
    """Return a list from a comma-separated environment variable."""
    value = os.environ.get(var_name)
    if value:
        return [item.strip() for item in value.split(',') if item.strip()]
    return default


def get_env_bool(var_name, default=False):
    """Parse a boolean environment variable."""
    value = os.environ.get(var_name)
    if value is None:
        return default
    return value.strip().lower() in {'1', 'true', 'yes', 'on'}


def get_env_int(var_name, default):
    """Parse an integer environment variable safely."""
    value = os.environ.get(var_name)
    if value is None:
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


DEFAULT_FRONTEND_URL = "http://localhost:3000"
DEFAULT_BACKEND_URL = "http://localhost:8000"

LOCAL_CLIENT_ORIGINS = [
    DEFAULT_FRONTEND_URL,
    "http://127.0.0.1:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

LOCAL_BACKEND_ORIGINS = [
    DEFAULT_BACKEND_URL,
    "http://127.0.0.1:8000",
]

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-change-me-in-production'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
    },
    'loggers': {
        'django.request': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}

ALLOWED_HOSTS = ['*']

# CSRF and CORS configuration defaults for local development
CSRF_TRUSTED_ORIGINS = get_env_list(
    'CSRF_TRUSTED_ORIGINS',
    LOCAL_CLIENT_ORIGINS + LOCAL_BACKEND_ORIGINS,
)

# Disable CSRF for development (alternative approach)
CSRF_COOKIE_HTTPONLY = False
CSRF_USE_SESSIONS = False

# Additional CSRF settings for development
CSRF_COOKIE_SECURE = False  # Set to True in production with HTTPS
CSRF_COOKIE_SAMESITE = 'Lax'
SESSION_COOKIE_SAMESITE = 'Lax'

# Exempt specific URLs from CSRF validation
CSRF_EXEMPT_URLS = [
    '/api/auth/register/',
    '/api/auth/password/reset/',
    '/api/auth/password/reset/confirm/',
]

# Frontend URL for admin "View site" link
FRONTEND_URL = os.environ.get('FRONTEND_URL', DEFAULT_FRONTEND_URL)

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Wagtail CMS apps (order matters)
    'wagtail.contrib.forms',
    'wagtail.contrib.redirects',
    'wagtail.embeds',
    'wagtail.sites',
    'wagtail.users',
    'wagtail.snippets',
    'wagtail.documents',
    'wagtail.images',
    'wagtail.search',
    'wagtail.admin',
    'wagtail',
    
    # Wagtail dependencies
    'modelcluster',
    'taggit',

    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'django_otp',
    'django_otp.plugins.otp_totp',
    'django_otp.plugins.otp_static',
    'phonenumber_field',
    'channels',

    # Local apps
    'apps.authentication',
    'apps.rooms',
    'apps.bookings',
    'apps.security',
    'apps.cms_content',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'icpac_booking.middleware.DisableCSRFForExemptURLs',  # Must be before CsrfViewMiddleware
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django_otp.middleware.OTPMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'wagtail.contrib.redirects.middleware.RedirectMiddleware',
    'apps.security.middleware.SecurityMiddleware',
]

ROOT_URLCONF = 'icpac_booking.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'icpac_booking.wsgi.application'
ASGI_APPLICATION = 'icpac_booking.asgi.application'

# Database - PostgreSQL configuration for both local and production
# Use SQLite for local development if USE_SQLITE is set or no PostgreSQL settings are configured
USE_SQLITE = get_env_bool('USE_SQLITE', False)

if USE_SQLITE or not os.environ.get('PGDATABASE'):
    # SQLite configuration for local development
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }
else:
    # PostgreSQL configuration for production
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': os.environ.get('PGDATABASE', 'icpac_booking'),
            'USER': os.environ.get('PGUSER', 'postgres'),
            'PASSWORD': os.environ.get('PGPASSWORD', ''),
            'HOST': os.environ.get('PGHOST', 'localhost'),
            'PORT': os.environ.get('PGPORT', '5432'),
            'OPTIONS': {},
            'CONN_MAX_AGE': 60,
        }
    }

# Use DATABASE_URL if available (for hosted deployments)
if 'DATABASE_URL' in os.environ:
    try:
        import dj_database_url  # type: ignore
    except ImportError as exc:  # pragma: no cover - configuration guard
        raise ImproperlyConfigured(
            "dj_database_url must be installed to use the DATABASE_URL setting"
        ) from exc
    else:
        DATABASES['default'] = dj_database_url.parse(os.environ['DATABASE_URL'])

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Nairobi'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS settings default to local development-safe origins
CORS_ALLOWED_ORIGINS = get_env_list(
    'CORS_ALLOWED_ORIGINS',
    LOCAL_CLIENT_ORIGINS + LOCAL_BACKEND_ORIGINS,
)

# Allow overriding via environment when broader access is required
CORS_ALLOW_ALL_ORIGINS = os.environ.get('CORS_ALLOW_ALL_ORIGINS', 'True').lower() == 'true'

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

# JWT Settings
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# Custom user model
AUTH_USER_MODEL = 'authentication.User'

# Wagtail CMS Settings
WAGTAIL_SITE_NAME = 'ICPAC Booking System CMS'
WAGTAILADMIN_BASE_URL = os.environ.get('BACKEND_BASE_URL', DEFAULT_BACKEND_URL)
DATA_UPLOAD_MAX_NUMBER_FIELDS = 10000

# Security Settings
ALLOWED_EMAIL_DOMAINS = [
    'icpac.net',
    'igad.int',
    'icpac.net.office',
    # Add more approved domains
]

# Enable OTP for enhanced security
OTP_TOTP_ISSUER = 'ICPAC Booking System'
OTP_LOGIN_URL = '/admin/login/'

# Security Headers
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'SAMEORIGIN'  # keep CMS previews working locally
SECURE_HSTS_SECONDS = 3600
SECURE_HSTS_INCLUDE_SUBDOMAINS = True

# Password Security
PASSWORD_RESET_TIMEOUT = 3600  # 1 hour
LOGIN_ATTEMPT_LIMIT = 5
LOGIN_LOCKOUT_TIME = 1800  # 30 minutes

# Email Configuration (OTP and notifications)
EMAIL_HOST = os.environ.get('EMAIL_HOST', '')
EMAIL_PORT = get_env_int('EMAIL_PORT', 587)
EMAIL_USE_TLS = get_env_bool('EMAIL_USE_TLS', True)
EMAIL_USE_SSL = get_env_bool('EMAIL_USE_SSL', False)

# Avoid conflicting TLS/SSL configuration
if EMAIL_USE_TLS and EMAIL_USE_SSL:
    EMAIL_USE_SSL = False

EMAIL_HOST_USER = os.environ.get('EMAIL_HOST_USER', '')
EMAIL_HOST_PASSWORD = os.environ.get('EMAIL_HOST_PASSWORD', '')
DEFAULT_FROM_EMAIL = os.environ.get('DEFAULT_FROM_EMAIL', 'noreply@icpac.net')
SERVER_EMAIL = os.environ.get('SERVER_EMAIL', DEFAULT_FROM_EMAIL)
EMAIL_TIMEOUT = get_env_int('EMAIL_TIMEOUT', 10)

EMAIL_BACKEND = os.environ.get('EMAIL_BACKEND')
if not EMAIL_BACKEND:
    EMAIL_BACKEND = (
        'django.core.mail.backends.smtp.EmailBackend'
        if EMAIL_HOST else 'django.core.mail.backends.console.EmailBackend'
    )

EMAIL_SUBJECT_PREFIX = os.environ.get('EMAIL_SUBJECT_PREFIX', '[ICPAC Booking] ')

# SMS/Phone OTP Settings (would need integration with SMS service)
SMS_BACKEND = 'dummy'  # Placeholder for SMS service
OTP_SMS_SENDER = 'ICPAC'

# Audit and Logging
LOG_USER_ACTIONS = True
LOG_API_REQUESTS = True
SESSION_COOKIE_AGE = 28800  # 8 hours
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# Channels configuration for WebSocket support
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
