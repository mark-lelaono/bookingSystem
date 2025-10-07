"""
Custom middleware for ICPAC Booking System
"""
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings


class DisableCSRFForExemptURLs(MiddlewareMixin):
    """
    Middleware to disable CSRF validation for specific URLs.
    This allows public endpoints like registration to work without CSRF tokens.
    """

    def process_request(self, request):
        """Check if the current path should be exempt from CSRF"""
        exempt_urls = getattr(settings, 'CSRF_EXEMPT_URLS', [])

        for url in exempt_urls:
            if request.path.startswith(url):
                setattr(request, '_dont_enforce_csrf_checks', True)
                break

        return None
