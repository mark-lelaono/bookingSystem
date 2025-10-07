"""
Security models for ICPAC Booking System
Handles domain restrictions, audit logging, login attempts, and security policies
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.core.validators import EmailValidator, RegexValidator
from django.conf import settings
import uuid

User = get_user_model()


class AllowedEmailDomain(models.Model):
    """
    Manage allowed email domains for user registration
    Only users with emails from these domains can register
    """
    domain = models.CharField(
        max_length=255,
        unique=True,
        validators=[
            RegexValidator(
                regex=r'^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
                message='Enter a valid domain name (e.g., icpac.net)'
            )
        ],
        help_text='Domain name (e.g., icpac.net, igad.int)'
    )
    
    description = models.CharField(
        max_length=255,
        blank=True,
        help_text='Description of the organization/department'
    )
    
    is_active = models.BooleanField(
        default=True,
        help_text='Whether this domain is currently allowed'
    )
    
    requires_approval = models.BooleanField(
        default=False,
        help_text='Whether users from this domain require admin approval'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_domains'
    )
    
    class Meta:
        db_table = 'security_allowed_domains'
        verbose_name = 'Allowed Email Domain'
        verbose_name_plural = 'Allowed Email Domains'
        ordering = ['domain']
    
    def __str__(self):
        return f"{self.domain} {'(Active)' if self.is_active else '(Inactive)'}"
    
    @classmethod
    def is_domain_allowed(cls, email):
        """Check if an email domain is allowed for registration"""
        if not email or '@' not in email:
            return False
        
        domain = email.split('@')[1].lower()
        return cls.objects.filter(domain__iexact=domain, is_active=True).exists()
    
    @classmethod
    def get_domain_info(cls, email):
        """Get domain information for an email"""
        if not email or '@' not in email:
            return None
        
        domain = email.split('@')[1].lower()
        try:
            return cls.objects.get(domain__iexact=domain, is_active=True)
        except cls.DoesNotExist:
            return None


class LoginAttempt(models.Model):
    """
    Track login attempts for security monitoring and rate limiting
    """
    ATTEMPT_TYPE_CHOICES = [
        ('success', 'Successful Login'),
        ('failed_password', 'Failed - Wrong Password'),
        ('failed_user', 'Failed - User Not Found'),
        ('failed_inactive', 'Failed - Account Inactive'),
        ('failed_locked', 'Failed - Account Locked'),
        ('failed_otp', 'Failed - Wrong OTP'),
        ('blocked', 'Blocked - Too Many Attempts'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='login_attempts',
        help_text='User account (if exists)'
    )
    
    email = models.EmailField(help_text='Email address attempted')
    ip_address = models.GenericIPAddressField(help_text='IP address of attempt')
    user_agent = models.TextField(blank=True, help_text='Browser user agent')
    
    attempt_type = models.CharField(
        max_length=20,
        choices=ATTEMPT_TYPE_CHOICES,
        help_text='Type of login attempt'
    )
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'security_login_attempts'
        verbose_name = 'Login Attempt'
        verbose_name_plural = 'Login Attempts'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['email', 'timestamp']),
            models.Index(fields=['ip_address', 'timestamp']),
            models.Index(fields=['attempt_type', 'timestamp']),
        ]
    
    def __str__(self):
        return f"{self.email} - {self.get_attempt_type_display()} at {self.timestamp}"
    
    @classmethod
    def is_ip_blocked(cls, ip_address):
        """Check if IP address is currently blocked due to too many failed attempts"""
        recent_time = timezone.now() - timezone.timedelta(minutes=settings.LOGIN_LOCKOUT_TIME // 60)
        
        failed_attempts = cls.objects.filter(
            ip_address=ip_address,
            timestamp__gte=recent_time,
            attempt_type__startswith='failed'
        ).count()
        
        return failed_attempts >= settings.LOGIN_ATTEMPT_LIMIT
    
    @classmethod
    def is_user_blocked(cls, email):
        """Check if user is currently blocked due to too many failed attempts"""
        recent_time = timezone.now() - timezone.timedelta(minutes=settings.LOGIN_LOCKOUT_TIME // 60)
        
        failed_attempts = cls.objects.filter(
            email__iexact=email,
            timestamp__gte=recent_time,
            attempt_type__startswith='failed'
        ).count()
        
        return failed_attempts >= settings.LOGIN_ATTEMPT_LIMIT
    
    @classmethod
    def record_attempt(cls, email, ip_address, user_agent, attempt_type, user=None):
        """Record a login attempt"""
        return cls.objects.create(
            user=user,
            email=email,
            ip_address=ip_address,
            user_agent=user_agent,
            attempt_type=attempt_type
        )


class AuditLog(models.Model):
    """
    Comprehensive audit logging for all system actions
    """
    ACTION_TYPES = [
        # User actions
        ('user_login', 'User Login'),
        ('user_logout', 'User Logout'),
        ('user_register', 'User Registration'),
        ('user_profile_update', 'Profile Update'),
        ('password_change', 'Password Change'),
        ('password_reset', 'Password Reset'),
        
        # Booking actions
        ('booking_create', 'Booking Created'),
        ('booking_update', 'Booking Updated'),
        ('booking_cancel', 'Booking Cancelled'),
        ('booking_approve', 'Booking Approved'),
        ('booking_reject', 'Booking Rejected'),
        
        # Room actions
        ('room_create', 'Room Created'),
        ('room_update', 'Room Updated'),
        ('room_delete', 'Room Deleted'),
        
        # Admin actions
        ('admin_action', 'Admin Action'),
        ('permission_change', 'Permission Change'),
        ('system_config', 'System Configuration'),
        
        # Security actions
        ('security_violation', 'Security Violation'),
        ('account_lock', 'Account Locked'),
        ('account_unlock', 'Account Unlocked'),
        
        # Other
        ('other', 'Other Action'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text='User who performed the action'
    )
    
    action_type = models.CharField(
        max_length=30,
        choices=ACTION_TYPES,
        help_text='Type of action performed'
    )
    
    description = models.TextField(help_text='Detailed description of the action')
    
    # Context information
    object_type = models.CharField(
        max_length=50,
        blank=True,
        help_text='Type of object affected (e.g., Booking, Room, User)'
    )
    
    object_id = models.CharField(
        max_length=50,
        blank=True,
        help_text='ID of the object affected'
    )
    
    # Request context
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text='IP address of the user'
    )
    
    user_agent = models.TextField(
        blank=True,
        help_text='Browser user agent'
    )
    
    # Additional data
    additional_data = models.JSONField(
        default=dict,
        blank=True,
        help_text='Additional context data in JSON format'
    )
    
    timestamp = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'security_audit_logs'
        verbose_name = 'Audit Log'
        verbose_name_plural = 'Audit Logs'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['user', 'timestamp']),
            models.Index(fields=['action_type', 'timestamp']),
            models.Index(fields=['object_type', 'object_id']),
            models.Index(fields=['ip_address', 'timestamp']),
        ]
    
    def __str__(self):
        user_info = f"{self.user.email}" if self.user else "Anonymous"
        return f"{user_info} - {self.get_action_type_display()} at {self.timestamp}"
    
    @classmethod
    def log_action(cls, user, action_type, description, **kwargs):
        """Helper method to log an action"""
        return cls.objects.create(
            user=user,
            action_type=action_type,
            description=description,
            object_type=kwargs.get('object_type', ''),
            object_id=kwargs.get('object_id', ''),
            ip_address=kwargs.get('ip_address'),
            user_agent=kwargs.get('user_agent', ''),
            additional_data=kwargs.get('additional_data', {})
        )


class OTPToken(models.Model):
    """
    Manage OTP tokens for enhanced authentication
    """
    TOKEN_TYPE_CHOICES = [
        ('email', 'Email OTP'),
        ('sms', 'SMS OTP'),
        ('registration', 'Registration Verification'),
        ('password_reset', 'Password Reset'),
        ('two_factor', 'Two-Factor Authentication'),
    ]
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='otp_tokens',
        help_text='User associated with this token'
    )
    
    token = models.CharField(
        max_length=10,
        help_text='OTP token (6-8 digits)'
    )
    
    token_type = models.CharField(
        max_length=20,
        choices=TOKEN_TYPE_CHOICES,
        help_text='Purpose of the OTP token'
    )
    
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        help_text='Phone number for SMS OTP'
    )
    
    email = models.EmailField(
        blank=True,
        help_text='Email address for email OTP'
    )
    
    is_used = models.BooleanField(
        default=False,
        help_text='Whether this token has been used'
    )
    
    attempts = models.PositiveIntegerField(
        default=0,
        help_text='Number of verification attempts'
    )
    
    max_attempts = models.PositiveIntegerField(
        default=3,
        help_text='Maximum allowed attempts'
    )
    
    expires_at = models.DateTimeField(help_text='When this token expires')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'security_otp_tokens'
        verbose_name = 'OTP Token'
        verbose_name_plural = 'OTP Tokens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"OTP for {self.user.email} - {self.get_token_type_display()}"
    
    def is_valid(self):
        """Check if token is still valid"""
        return (
            not self.is_used and
            self.attempts < self.max_attempts and
            timezone.now() < self.expires_at
        )
    
    def verify(self, provided_token):
        """Verify the provided token"""
        self.attempts += 1
        self.save()
        
        if not self.is_valid():
            return False
        
        if self.token == provided_token:
            self.is_used = True
            self.save()
            return True
        
        return False
    
    @classmethod
    def generate_token(cls, length=6):
        """Generate a random OTP token"""
        import random
        import string
        return ''.join(random.choices(string.digits, k=length))
    
    @classmethod
    def create_otp(cls, user, token_type, expires_in_minutes=10, **kwargs):
        """Create a new OTP token"""
        token = cls.generate_token()
        expires_at = timezone.now() + timezone.timedelta(minutes=expires_in_minutes)
        
        return cls.objects.create(
            user=user,
            token=token,
            token_type=token_type,
            expires_at=expires_at,
            phone_number=kwargs.get('phone_number', ''),
            email=kwargs.get('email', user.email),
            max_attempts=kwargs.get('max_attempts', 3)
        )


class SecurityPolicy(models.Model):
    """
    System-wide security policies and configurations
    """
    POLICY_TYPES = [
        ('password', 'Password Policy'),
        ('session', 'Session Policy'),
        ('login', 'Login Policy'),
        ('registration', 'Registration Policy'),
        ('otp', 'OTP Policy'),
        ('rate_limit', 'Rate Limiting'),
        ('general', 'General Security'),
    ]
    
    name = models.CharField(max_length=100, unique=True)
    policy_type = models.CharField(max_length=20, choices=POLICY_TYPES)
    description = models.TextField()
    
    # Policy settings as JSON
    settings = models.JSONField(
        default=dict,
        help_text='Policy configuration in JSON format'
    )
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'security_policies'
        verbose_name = 'Security Policy'
        verbose_name_plural = 'Security Policies'
        ordering = ['policy_type', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_policy_type_display()})"
    
    @classmethod
    def get_policy_setting(cls, policy_name, setting_key, default=None):
        """Get a specific policy setting"""
        try:
            policy = cls.objects.get(name=policy_name, is_active=True)
            return policy.settings.get(setting_key, default)
        except cls.DoesNotExist:
            return default