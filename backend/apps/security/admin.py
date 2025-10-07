"""
Admin interface for security models
"""
from django.contrib import admin
from django.utils.html import format_html
from django.utils import timezone
from .models import AllowedEmailDomain, LoginAttempt, AuditLog, OTPToken, SecurityPolicy


@admin.register(AllowedEmailDomain)
class AllowedEmailDomainAdmin(admin.ModelAdmin):
    list_display = ('domain', 'description', 'is_active', 'requires_approval', 'created_at')
    list_filter = ('is_active', 'requires_approval', 'created_at')
    search_fields = ('domain', 'description')
    readonly_fields = ('created_at', 'created_by')
    
    def save_model(self, request, obj, form, change):
        if not change:  # Only set created_by for new objects
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ('email', 'attempt_type', 'ip_address', 'timestamp', 'user_link')
    list_filter = ('attempt_type', 'timestamp')
    search_fields = ('email', 'ip_address', 'user__first_name', 'user__last_name')
    readonly_fields = ('user', 'email', 'ip_address', 'user_agent', 'attempt_type', 'timestamp')
    date_hierarchy = 'timestamp'
    
    def user_link(self, obj):
        if obj.user:
            return format_html('<a href="/admin/authentication/user/{}/change/">{}</a>', 
                             obj.user.id, obj.user.get_full_name())
        return '-'
    user_link.short_description = 'User'
    
    def has_add_permission(self, request):
        return False  # Don't allow manual creation
    
    def has_change_permission(self, request, obj=None):
        return False  # Read-only


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('user_display', 'action_type', 'object_type', 'description_short', 'timestamp')
    list_filter = ('action_type', 'object_type', 'timestamp')
    search_fields = ('user__email', 'description', 'object_id')
    readonly_fields = ('id', 'user', 'action_type', 'description', 'object_type', 
                      'object_id', 'ip_address', 'user_agent', 'additional_data', 'timestamp')
    date_hierarchy = 'timestamp'
    
    def user_display(self, obj):
        if obj.user:
            return obj.user.email
        return 'Anonymous'
    user_display.short_description = 'User'
    
    def description_short(self, obj):
        return obj.description[:100] + '...' if len(obj.description) > 100 else obj.description
    description_short.short_description = 'Description'
    
    def has_add_permission(self, request):
        return False  # Don't allow manual creation
    
    def has_change_permission(self, request, obj=None):
        return False  # Read-only


@admin.register(OTPToken)
class OTPTokenAdmin(admin.ModelAdmin):
    list_display = ('user', 'token_type', 'is_used', 'attempts', 'expires_at', 'created_at')
    list_filter = ('token_type', 'is_used', 'created_at')
    search_fields = ('user__email', 'email', 'phone_number')
    readonly_fields = ('token', 'user', 'token_type', 'phone_number', 'email', 
                      'attempts', 'expires_at', 'created_at')
    
    def has_add_permission(self, request):
        return False  # Don't allow manual creation


@admin.register(SecurityPolicy)
class SecurityPolicyAdmin(admin.ModelAdmin):
    list_display = ('name', 'policy_type', 'is_active', 'updated_at')
    list_filter = ('policy_type', 'is_active')
    search_fields = ('name', 'description')
    
    fieldsets = (
        (None, {
            'fields': ('name', 'policy_type', 'description', 'is_active')
        }),
        ('Policy Settings', {
            'fields': ('settings',),
            'classes': ('wide',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )
    
    readonly_fields = ('created_at', 'updated_at')