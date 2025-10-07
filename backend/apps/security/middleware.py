"""
Security middleware for ICPAC Booking System
Handles security monitoring, rate limiting, and audit logging
"""
from django.http import HttpResponseForbidden, JsonResponse
from django.utils import timezone
from django.conf import settings
from django.contrib.auth import get_user_model
from .models import LoginAttempt, AuditLog
import json

User = get_user_model()


class SecurityMiddleware:
    """
    Custom security middleware for enhanced protection
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Pre-process request
        self.process_request(request)
        
        response = self.get_response(request)
        
        # Post-process response
        self.process_response(request, response)
        
        return response
    
    def process_request(self, request):
        """Process incoming request for security checks"""
        # Get client IP
        ip_address = self.get_client_ip(request)
        request.client_ip = ip_address
        
        # Check if IP is blocked
        if LoginAttempt.is_ip_blocked(ip_address):
            # Log the blocked attempt
            AuditLog.log_action(
                user=None,
                action_type='security_violation',
                description=f'Blocked request from IP {ip_address} - too many failed login attempts',
                ip_address=ip_address,
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            if request.path.startswith('/api/'):
                return JsonResponse(
                    {'error': 'Too many failed attempts. Please try again later.'},
                    status=429
                )
            return HttpResponseForbidden('Access denied due to too many failed attempts.')
        
        # Log API requests if enabled
        if getattr(settings, 'LOG_API_REQUESTS', False) and request.path.startswith('/api/'):
            self.log_api_request(request)
    
    def process_response(self, request, response):
        """Process response for additional security"""
        # Add security headers
        response['X-Content-Type-Options'] = 'nosniff'
        response['X-Frame-Options'] = 'DENY'
        response['X-XSS-Protection'] = '1; mode=block'
        response['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        
        return response
    
    def get_client_ip(self, request):
        """Get the real IP address of the client"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    def log_api_request(self, request):
        """Log API requests for monitoring"""
        user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
        
        AuditLog.log_action(
            user=user,
            action_type='other',
            description=f'API Request: {request.method} {request.path}',
            ip_address=request.client_ip,
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            additional_data={
                'method': request.method,
                'path': request.path,
                'query_params': dict(request.GET),
                'content_type': request.content_type,
            }
        )