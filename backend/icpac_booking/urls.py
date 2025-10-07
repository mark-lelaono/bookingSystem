"""
URL configuration for icpac_booking project.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.shortcuts import redirect

# Wagtail imports
from wagtail.admin import urls as wagtailadmin_urls
from wagtail import urls as wagtail_urls
from wagtail.documents import urls as wagtaildocs_urls

def api_info(request):
    return JsonResponse({
        'message': 'ICPAC Booking API',
        'version': '1.0',
        'endpoints': {
            'auth': '/api/auth/',
            'rooms': '/api/rooms/',
            'bookings': '/api/bookings/',
            'admin': '/admin/'
        }
    })

def redirect_to_frontend(request):
    """Redirect to React frontend"""
    return redirect(settings.FRONTEND_URL)

urlpatterns = [
    # Django admin (renamed to avoid conflict with Wagtail)
    path('django-admin/', admin.site.urls),
    
    # Wagtail CMS admin
    path('cms/', include(wagtailadmin_urls)),
    path('documents/', include(wagtaildocs_urls)),
    
    # Frontend redirect for admin "View site" link (specific path)
    path('admin-site/', redirect_to_frontend, name='frontend_redirect'),
    
    # API endpoints
    path('api/', api_info, name='api_info'),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/rooms/', include('apps.rooms.urls')),
    path('api/bookings/', include('apps.bookings.urls')),
    path('api/security/', include('apps.security.urls')),
    
    # Wagtail pages (catch-all - must be last)
    path('', include(wagtail_urls)),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
