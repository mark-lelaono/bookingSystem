"""
Booking models for ICPAC Booking System
"""
from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import datetime, time, timedelta

User = get_user_model()


class Booking(models.Model):
    """
    Main booking model for room reservations
    """
    BOOKING_TYPE_CHOICES = [
        ('hourly', 'Hourly'),
        ('full_day', 'Full Day'),
        ('multi_day', 'Multi Day'),
        ('weekly', 'Weekly'),
    ]
    
    APPROVAL_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('cancelled', 'Cancelled'),
    ]
    
    # Basic booking information
    room = models.ForeignKey(
        'rooms.Room',
        on_delete=models.CASCADE,
        related_name='bookings',
        help_text='Room being booked'
    )
    
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='bookings',
        help_text='User making the booking'
    )
    
    purpose = models.CharField(
        max_length=255,
        help_text='Meeting/event purpose or title'
    )
    
    special_requirements = models.TextField(
        blank=True,
        help_text='Special requirements or notes'
    )
    
    # Date and time information
    start_date = models.DateField(help_text='Start date of booking')
    end_date = models.DateField(help_text='End date of booking')
    start_time = models.TimeField(help_text='Start time')
    end_time = models.TimeField(help_text='End time')

    # For multi-day bookings with non-consecutive dates
    selected_dates = models.JSONField(
        default=list,
        blank=True,
        help_text='Array of selected dates for multi-day bookings (e.g., ["2025-10-06", "2025-10-08", "2025-10-10"])'
    )

    # Booking configuration
    booking_type = models.CharField(
        max_length=20,
        choices=BOOKING_TYPE_CHOICES,
        default='hourly',
        help_text='Type of booking'
    )
    
    expected_attendees = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text='Expected number of attendees'
    )
    
    # Approval workflow
    approval_status = models.CharField(
        max_length=20,
        choices=APPROVAL_STATUS_CHOICES,
        default='pending',
        help_text='Booking approval status'
    )
    
    approved_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='approved_bookings',
        help_text='Admin who approved/rejected the booking'
    )
    
    approved_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the booking was approved/rejected'
    )
    
    rejection_reason = models.TextField(
        blank=True,
        help_text='Reason for rejection if booking was rejected'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bookings'
        verbose_name = 'Booking'
        verbose_name_plural = 'Bookings'
        ordering = ['-created_at']
        
        # Prevent double booking (same room, overlapping times)
        constraints = [
            models.CheckConstraint(
                check=models.Q(start_date__lte=models.F('end_date')),
                name='check_start_date_before_end_date'
            ),
        ]
    
    def __str__(self):
        # Format dates based on booking type
        if self.booking_type == 'multi_day' and self.selected_dates and len(self.selected_dates) > 0:
            # Show individual dates with commas and "and" for the last one
            date_strs = [str(d) if hasattr(d, 'year') else d for d in self.selected_dates]
            if len(date_strs) == 1:
                dates_display = date_strs[0]
            elif len(date_strs) == 2:
                dates_display = f"{date_strs[0]} and {date_strs[1]}"
            else:
                # Use commas and "and" for last: "date1, date2, and date3"
                dates_display = ', '.join(date_strs[:-1]) + f", and {date_strs[-1]}"
            return f"{self.purpose} - {self.room.name} ({dates_display})"
        elif self.start_date == self.end_date:
            return f"{self.purpose} - {self.room.name} ({self.start_date})"
        else:
            return f"{self.purpose} - {self.room.name} ({self.start_date} to {self.end_date})"
    
    def clean(self):
        """Validate booking data"""
        errors = {}

        # Validate dates
        if self.start_date and self.end_date and self.start_date > self.end_date:
            errors['end_date'] = 'End date must be after start date.'

        # Validate times
        if self.start_time and self.end_time and self.start_time >= self.end_time:
            errors['end_time'] = 'End time must be after start time.'

        # Check if booking is in the past
        if self.start_date and self.start_date < timezone.now().date():
            errors['start_date'] = 'Cannot book in the past.'

        if self.start_date == timezone.now().date():
            current_time = timezone.now().time()
            if self.start_time <= current_time:
                errors['start_time'] = 'Cannot book in the past.'

        # Validate booking type specific rules
        if self.booking_type == 'full_day':
            # Full day should be 8 AM to 6 PM
            if self.start_time != time(8, 0) or self.end_time != time(18, 0):
                errors['booking_type'] = 'Full day booking must be from 8:00 AM to 6:00 PM.'
            if self.start_date != self.end_date:
                errors['booking_type'] = 'Full day booking must be for a single day.'

        elif self.booking_type == 'hourly':
            # Hourly booking should be within the same day
            if self.start_date != self.end_date:
                errors['booking_type'] = 'Hourly booking must be within a single day.'

        elif self.booking_type == 'weekly':
            # Weekly booking should be exactly 7 days
            if self.start_date and self.end_date:
                duration_days = (self.end_date - self.start_date).days + 1
                if duration_days != 7:
                    errors['booking_type'] = 'Weekly booking must be exactly 7 consecutive days.'

        elif self.booking_type == 'multi_day':
            # Multi-day can use selected_dates array for non-consecutive days
            if self.selected_dates and len(self.selected_dates) > 0:
                # Validate selected_dates
                if len(self.selected_dates) < 2:
                    errors['selected_dates'] = 'Multi-day booking must have at least 2 selected dates.'
                if len(self.selected_dates) > 6:
                    errors['selected_dates'] = 'Multi-day booking cannot exceed 6 days.'

                # Ensure all dates are within start_date and end_date range
                if self.start_date and self.end_date:
                    for date_item in self.selected_dates:
                        try:
                            # Handle both string and date object formats
                            if isinstance(date_item, str):
                                date_obj = datetime.strptime(date_item, '%Y-%m-%d').date()
                            elif hasattr(date_item, 'year'):  # It's already a date object
                                date_obj = date_item
                            else:
                                errors['selected_dates'] = 'Invalid date format in selected_dates.'
                                break

                            if date_obj < self.start_date or date_obj > self.end_date:
                                errors['selected_dates'] = 'All selected dates must be within start and end date range.'
                                break
                        except (ValueError, TypeError):
                            errors['selected_dates'] = 'Invalid date format in selected_dates. Use YYYY-MM-DD.'
                            break
            else:
                # If no selected_dates, fall back to consecutive days validation
                if self.start_date and self.end_date:
                    duration_days = (self.end_date - self.start_date).days + 1
                    if duration_days < 2:
                        errors['booking_type'] = 'Multi-day booking must span at least 2 days.'
                    if duration_days >= 7:
                        errors['booking_type'] = 'Multi-day booking should be less than 7 days. Use weekly booking instead.'

        # Check attendee count doesn't exceed room capacity
        if self.room and self.expected_attendees > self.room.capacity:
            errors['expected_attendees'] = f'Attendee count ({self.expected_attendees}) exceeds room capacity ({self.room.capacity}).'

        # Check for overlapping bookings (only for approved/pending bookings)
        if self.room:
            overlapping = Booking.objects.filter(
                room=self.room,
                approval_status__in=['pending', 'approved'],
                start_date__lte=self.end_date,
                end_date__gte=self.start_date,
            ).exclude(pk=self.pk if self.pk else None)

            # Check time overlap for same dates
            for booking in overlapping:
                if (self.start_date <= booking.end_date and self.end_date >= booking.start_date):
                    # Same day, check time overlap
                    if (self.start_time < booking.end_time and self.end_time > booking.start_time):
                        errors['start_time'] = f'Time slot conflicts with existing booking: {booking.purpose}'
                        break

        if errors:
            raise ValidationError(errors)
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
    
    def get_duration_hours(self):
        """Calculate booking duration in hours"""
        if self.start_time and self.end_time:
            start_datetime = datetime.combine(self.start_date, self.start_time)
            end_datetime = datetime.combine(self.end_date, self.end_time)
            duration = end_datetime - start_datetime
            return duration.total_seconds() / 3600
        return 0
    
    @property
    def duration_hours(self):
        """Calculate booking duration in hours"""
        return self.get_duration_hours()
    
    @property
    def duration_days(self):
        """Calculate booking duration in days"""
        if self.start_date and self.end_date:
            return (self.end_date - self.start_date).days + 1
        return 1
    
    @property
    def is_approved(self):
        """Check if booking is approved"""
        return self.approval_status == 'approved'
    
    @property
    def is_pending(self):
        """Check if booking is pending approval"""
        return self.approval_status == 'pending'
    
    @property
    def is_rejected(self):
        """Check if booking is rejected"""
        return self.approval_status == 'rejected'
    
    @property
    def is_in_progress(self):
        """Check if booking is currently in progress"""
        if not self.is_approved:
            return False
            
        now = timezone.now()
        current_date = now.date()
        current_time = now.time()
        
        return (
            self.start_date <= current_date <= self.end_date and
            self.start_time <= current_time <= self.end_time
        )
    
    @property
    def is_upcoming(self):
        """Check if booking is upcoming"""
        if not self.is_approved:
            return False
            
        now = timezone.now()
        start_datetime = datetime.combine(self.start_date, self.start_time)
        start_datetime = timezone.make_aware(start_datetime)
        
        return start_datetime > now
    
    @property
    def is_completed(self):
        """Check if booking is completed"""
        now = timezone.now()
        end_datetime = datetime.combine(self.end_date, self.end_time)
        end_datetime = timezone.make_aware(end_datetime)
        
        return end_datetime < now
    
    def approve(self, approved_by_user):
        """Approve the booking"""
        self.approval_status = 'approved'
        self.approved_by = approved_by_user
        self.approved_at = timezone.now()
        self.rejection_reason = ''
        self.save()
    
    def reject(self, rejected_by_user, reason=''):
        """Reject the booking"""
        self.approval_status = 'rejected'
        self.approved_by = rejected_by_user
        self.approved_at = timezone.now()
        self.rejection_reason = reason
        self.save()
    
    def can_be_modified_by(self, user):
        """Check if user can modify this booking"""
        # Super admin can modify any booking
        if user.role == 'super_admin':
            return True
        
        # Room admin can modify bookings for their rooms
        if user.role == 'room_admin':
            return True
        
        # User can modify their own bookings (pending or approved)
        if self.user == user and self.approval_status in ['pending', 'approved']:
            return True
        
        return False
    
    def can_approve_booking(self, user):
        """Check if user can approve this booking"""
        # Only pending bookings can be approved
        if not self.is_pending:
            return False
        
        # Super admin can approve any booking
        if user.role == 'super_admin':
            return True
        
        # Room admin can approve bookings for their rooms
        if user.role == 'room_admin':
            return True
        
        return False


class BookingNote(models.Model):
    """
    Notes/comments on bookings for communication between users and admins
    """
    booking = models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='notes'
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    note = models.TextField()
    is_internal = models.BooleanField(
        default=False,
        help_text='Internal notes visible only to admins'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'booking_notes'
        ordering = ['created_at']
    
    def __str__(self):
        return f"Note for {self.booking.purpose} by {self.user.get_full_name()}"


