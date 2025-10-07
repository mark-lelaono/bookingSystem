"""
URL configuration for security app
"""
from django.urls import path
from . import views

app_name = 'security'

urlpatterns = [
    # OTP endpoints
    path('otp/generate/', views.GenerateOTPView.as_view(), name='generate_otp'),
    path('otp/verify/', views.VerifyOTPView.as_view(), name='verify_otp'),
    
    # Security check endpoints
    path('check-domain/', views.CheckDomainView.as_view(), name='check_domain'),
    path('login-attempt/', views.RecordLoginAttemptView.as_view(), name='record_login_attempt'),
    
    # Audit log endpoints (admin only)
    path('audit-logs/', views.AuditLogListView.as_view(), name='audit_logs'),
]