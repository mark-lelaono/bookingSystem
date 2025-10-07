"""
Custom User model for ICPAC Booking System
"""
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import random
import string


class User(AbstractUser):
    """
    Custom User model with role-based permissions for ICPAC
    """
    ROLE_CHOICES = [
        ('user', 'User'),
        ('room_admin', 'Room Admin'),
        ('super_admin', 'Super Admin'),
        ('procurement_officer', 'Procurement Officer'),
    ]
    
    # Override email to be unique and required
    email = models.EmailField(unique=True)
    
    # Additional fields
    role = models.CharField(
        max_length=20, 
        choices=ROLE_CHOICES, 
        default='user',
        help_text='User role determines access permissions'
    )
    
    # Email verification
    is_email_verified = models.BooleanField(
        default=False,
        help_text='Whether user has verified their email address'
    )
    
    phone_number = models.CharField(
        max_length=15, 
        blank=True,
        help_text='Contact phone number'
    )
    
    department = models.CharField(
        max_length=100, 
        blank=True,
        help_text='User department at ICPAC'
    )
    
    # Many-to-many relationship with rooms (for room admins)
    managed_rooms = models.ManyToManyField(
        'rooms.Room', 
        blank=True, 
        related_name='admins',
        help_text='Rooms this user can manage (for room admins)'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Use email as the primary identifier
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']
    
    class Meta:
        db_table = 'auth_user'
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['email']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.email})"
    
    def get_full_name(self):
        """Return the first_name plus the last_name, with a space in between."""
        full_name = f"{self.first_name} {self.last_name}"
        return full_name.strip()
    
    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name
    
    @property
    def is_super_admin(self):
        """Check if user is super admin"""
        return self.role == 'super_admin'
    
    @property
    def is_room_admin(self):
        """Check if user is room admin"""
        return self.role == 'room_admin'
    
    @property
    def is_procurement_officer(self):
        """Check if user is procurement officer"""
        return self.role == 'procurement_officer'
    
    def can_manage_room(self, room):
        """Check if user can manage a specific room"""
        if self.is_super_admin:
            return True
        if self.is_room_admin:
            return self.managed_rooms.filter(id=room.id).exists()
        return False
    
    def can_approve_booking(self, booking):
        """Check if user can approve a booking"""
        if self.is_super_admin:
            return True
        if self.is_room_admin:
            return self.managed_rooms.filter(id=booking.room.id).exists()
        return False


class EmailVerificationOTP(models.Model):
    """
    Model to store email verification OTP codes
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='email_verification_otps'
    )
    
    otp_code = models.CharField(
        max_length=6,
        help_text='6-digit OTP code for email verification'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'auth_email_verification_otp'
        verbose_name = 'Email Verification OTP'
        verbose_name_plural = 'Email Verification OTPs'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"OTP for {self.user.email} - {self.otp_code}"
    
    @classmethod
    def generate_otp_for_user(cls, user):
        """Generate a new OTP code for user email verification"""
        # Generate 6-digit OTP
        otp_code = ''.join(random.choices(string.digits, k=6))
        
        # Set expiration time (10 minutes from now)
        expires_at = timezone.now() + timezone.timedelta(minutes=10)
        
        # Create OTP record
        otp = cls.objects.create(
            user=user,
            otp_code=otp_code,
            expires_at=expires_at
        )
        
        return otp
    
    def is_valid(self):
        """Check if OTP is still valid (not expired and not used)"""
        return not self.is_used and self.expires_at > timezone.now()
    
    def verify(self, input_code):
        """Verify the OTP code"""
        if not self.is_valid():
            return False
        
        if self.otp_code == input_code:
            self.is_used = True
            self.save()
            
            # Mark user email as verified
            self.user.is_email_verified = True
            self.user.save()
            
            return True
        
        return False