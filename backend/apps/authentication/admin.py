from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from .models import User, EmailVerificationOTP


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin interface for User model
    """
    list_display = (
        'email', 'first_name', 'last_name', 'role', 
        'is_email_verified', 'is_active', 'is_staff', 
        'date_joined', 'last_login'
    )
    
    list_filter = (
        'role', 'is_email_verified', 'is_active', 'is_staff', 
        'is_superuser', 'date_joined', 'last_login'
    )
    
    search_fields = ('email', 'first_name', 'last_name')
    ordering = ('-date_joined',)
    
    fieldsets = (
        (None, {
            'fields': ('email', 'password')
        }),
        ('Personal info', {
            'fields': ('first_name', 'last_name', 'phone_number')
        }),
        ('Permissions', {
            'fields': (
                'role', 'is_active', 'is_staff', 'is_superuser',
                'groups', 'user_permissions'
            ),
        }),
        ('Email Verification', {
            'fields': ('is_email_verified',)
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined')
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': (
                'email', 'first_name', 'last_name', 'role',
                'password1', 'password2', 'is_email_verified'
            ),
        }),
    )
    
    readonly_fields = ('date_joined', 'last_login')
    
    def get_queryset(self, request):
        """Optimize queryset for admin"""
        return super().get_queryset(request).select_related()


@admin.register(EmailVerificationOTP)
class EmailVerificationOTPAdmin(admin.ModelAdmin):
    """
    Admin interface for Email Verification OTP
    """
    list_display = (
        'user_email', 'otp_code', 'created_at', 
        'expires_at', 'is_used', 'is_valid_display'
    )
    
    list_filter = ('is_used', 'created_at', 'expires_at')
    search_fields = ('user__email', 'otp_code')
    ordering = ('-created_at',)
    
    readonly_fields = ('created_at', 'expires_at', 'is_valid_display')
    
    def user_email(self, obj):
        """Display user email"""
        return obj.user.email
    user_email.short_description = 'User Email'
    user_email.admin_order_field = 'user__email'
    
    def is_valid_display(self, obj):
        """Display if OTP is valid with colored indicator"""
        if obj.is_valid():
            return format_html(
                '<span style="color: green; font-weight: bold;">✓ Valid</span>'
            )
        else:
            return format_html(
                '<span style="color: red; font-weight: bold;">✗ Invalid/Expired</span>'
            )
    is_valid_display.short_description = 'Status'
    
    def has_add_permission(self, request):
        """Prevent manual creation of OTP codes"""
        return False
