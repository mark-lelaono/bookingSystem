"""
Authentication URLs for ICPAC Booking System
"""
from django.urls import path
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

app_name = 'authentication'

urlpatterns = [
    # Authentication endpoints
    path('login/', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('register/', csrf_exempt(views.UserRegistrationView.as_view()), name='register'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Email verification endpoints
    path('verify-email/', views.VerifyEmailOTPView.as_view(), name='verify_email'),
    path('resend-otp/', views.ResendOTPView.as_view(), name='resend_otp'),

    # Password reset endpoints
    path('password/reset/', csrf_exempt(views.request_password_reset), name='password_reset_request'),
    path('password/reset/confirm/', csrf_exempt(views.reset_password_confirm), name='password_reset_confirm'),

    # User profile endpoints
    path('profile/', views.CurrentUserView.as_view(), name='current_user'),
    path('password/change/', views.PasswordChangeView.as_view(), name='password_change'),
    path('dashboard/stats/', views.user_dashboard_stats, name='dashboard_stats'),
    
    # User management endpoints (admin only)
    path('users/', views.UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
]