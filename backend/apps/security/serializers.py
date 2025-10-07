"""
Serializers for security models
"""
from rest_framework import serializers
from .models import AllowedEmailDomain, LoginAttempt, AuditLog, OTPToken, SecurityPolicy


class AllowedEmailDomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = AllowedEmailDomain
        fields = ['id', 'domain', 'description', 'is_active', 'requires_approval', 'created_at']
        read_only_fields = ['id', 'created_at']


class LoginAttemptSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = LoginAttempt
        fields = ['id', 'user', 'user_email', 'email', 'ip_address', 'attempt_type', 'timestamp']
        read_only_fields = ['id', 'timestamp']


class AuditLogSerializer(serializers.ModelSerializer):
    user_email = serializers.CharField(source='user.email', read_only=True)
    action_type_display = serializers.CharField(source='get_action_type_display', read_only=True)
    
    class Meta:
        model = AuditLog
        fields = [
            'id', 'user', 'user_email', 'action_type', 'action_type_display',
            'description', 'object_type', 'object_id', 'ip_address',
            'additional_data', 'timestamp'
        ]
        read_only_fields = ['id', 'timestamp']


class OTPTokenSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTPToken
        fields = [
            'id', 'token_type', 'phone_number', 'email', 'is_used',
            'attempts', 'max_attempts', 'expires_at', 'created_at'
        ]
        read_only_fields = ['id', 'token', 'attempts', 'created_at']


class SecurityPolicySerializer(serializers.ModelSerializer):
    policy_type_display = serializers.CharField(source='get_policy_type_display', read_only=True)
    
    class Meta:
        model = SecurityPolicy
        fields = [
            'id', 'name', 'policy_type', 'policy_type_display',
            'description', 'settings', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']