"""
Room models for ICPAC Booking System
"""
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Room(models.Model):
    """
    Room model representing meeting rooms, conference rooms, etc.
    """
    CATEGORY_CHOICES = [
        ('conference', 'Conference Room'),
        ('meeting', 'Meeting Room'),
        ('boardroom', 'Boardroom'),
        ('training', 'Training Room'),
        ('event_hall', 'Event Hall'),
        ('auditorium', 'Auditorium'),
        ('other', 'Other'),
    ]
    
    name = models.CharField(
        max_length=255,
        help_text='Room name (e.g., "Conference Room A - Main Building")'
    )
    
    capacity = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(1000)],
        help_text='Maximum number of people the room can accommodate'
    )
    
    category = models.CharField(
        max_length=50,
        choices=CATEGORY_CHOICES,
        help_text='Type/category of the room'
    )
    
    floor = models.CharField(
        max_length=100,
        default='Ground Floor',
        help_text='Floor location of the room'
    )

    location = models.CharField(
        max_length=255,
        blank=True,
        help_text='Physical location of the room (building, floor, etc.)'
    )
    
    description = models.TextField(
        blank=True,
        help_text='Detailed description of the room'
    )
    
    # JSON field to store amenities list
    amenities = models.JSONField(
        default=list,
        blank=True,
        help_text='List of available amenities (projector, whiteboard, etc.)'
    )
    
    # Room image
    image = models.ImageField(
        upload_to='rooms/',
        blank=True,
        null=True,
        help_text='Room photo'
    )
    
    # Room availability
    is_active = models.BooleanField(
        default=True,
        help_text='Whether the room is available for booking'
    )
    
    # Booking settings
    advance_booking_days = models.PositiveIntegerField(
        default=30,
        help_text='How many days in advance room can be booked'
    )
    
    min_booking_duration = models.PositiveIntegerField(
        default=1,
        help_text='Minimum booking duration in hours'
    )
    
    max_booking_duration = models.PositiveIntegerField(
        default=8,
        help_text='Maximum booking duration in hours'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'rooms'
        verbose_name = 'Room'
        verbose_name_plural = 'Rooms'
        ordering = ['id']  # Order by primary key to maintain consistent frontend mapping
        
    def __str__(self):
        return f"{self.name} (Capacity: {self.capacity})"
    
    @property
    def category_display(self):
        """Get the display name for category"""
        return dict(self.CATEGORY_CHOICES).get(self.category, self.category)
    
    @property
    def is_large_room(self):
        """Check if room has large capacity (>50 people)"""
        return self.capacity > 50
    
    def get_amenities_list(self):
        """Get amenities as a formatted list"""
        if isinstance(self.amenities, list):
            return self.amenities
        return []
    
    def has_amenity(self, amenity):
        """Check if room has a specific amenity"""
        amenities = self.get_amenities_list()
        return amenity.lower() in [a.lower() for a in amenities]
    
    def is_available_for_booking(self):
        """Check if room is available for booking"""
        return self.is_active
    
    def get_bookings_for_date(self, date):
        """Get all bookings for a specific date"""
        from apps.bookings.models import Booking
        return Booking.objects.filter(
            room=self,
            start_date__lte=date,
            end_date__gte=date,
            approval_status__in=['pending', 'approved']
        ).order_by('start_time')

    def get_availability_level(self, date):
        """
        Get availability level for a specific date
        Returns: 'available', 'partially_booked', or 'fully_booked'
        """
        from datetime import time
        from apps.bookings.models import Booking

        # Get all approved/pending bookings for this date
        bookings = self.get_bookings_for_date(date)

        if not bookings.exists():
            return 'available'

        # Define working hours (8 AM to 6 PM = 10 hours)
        working_start = time(8, 0)
        working_end = time(18, 0)
        total_working_minutes = 10 * 60  # 600 minutes

        # Calculate total booked minutes
        booked_minutes = 0
        for booking in bookings:
            # Get booking time range for this specific date
            start_time = max(booking.start_time, working_start)
            end_time = min(booking.end_time, working_end)

            # Calculate duration in minutes
            start_minutes = start_time.hour * 60 + start_time.minute
            end_minutes = end_time.hour * 60 + end_time.minute
            duration = max(0, end_minutes - start_minutes)
            booked_minutes += duration

        # Calculate booking percentage
        booking_percentage = (booked_minutes / total_working_minutes) * 100

        # Determine availability level
        if booking_percentage >= 100:
            return 'fully_booked'
        elif booking_percentage > 0:
            return 'partially_booked'
        else:
            return 'available'

    def can_accept_booking(self, date, start_time, end_time, booking_type='hourly'):
        """
        Check if room can accept a new booking
        Returns: (can_book: bool, reason: str, conflicts: list)
        """
        from apps.bookings.models import Booking
        from datetime import time as datetime_time

        # Check if room is active
        if not self.is_active:
            return False, 'Room is currently unavailable', []

        # Get conflicting bookings
        bookings = self.get_bookings_for_date(date)
        conflicts = []

        for booking in bookings:
            # Check for time overlap
            if (start_time < booking.end_time and end_time > booking.start_time):
                conflicts.append({
                    'id': booking.id,
                    'purpose': booking.purpose,
                    'start_time': booking.start_time.strftime('%H:%M'),
                    'end_time': booking.end_time.strftime('%H:%M'),
                    'booking_type': booking.booking_type
                })

        if conflicts:
            return False, 'Time slot conflicts with existing booking(s)', conflicts

        return True, 'Available', []


class RoomAmenity(models.Model):
    """
    Predefined room amenities for consistency
    """
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True, help_text='Emoji or icon code')
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'room_amenities'
        verbose_name = 'Room Amenity'
        verbose_name_plural = 'Room Amenities'
        ordering = ['name']
    
    def __str__(self):
        return self.name
    
    @classmethod
    def get_default_amenities(cls):
        """Get list of default amenities"""
        defaults = [
            {'name': 'Projector', 'icon': '📽️', 'description': 'Digital projector for presentations'},
            {'name': 'Whiteboard', 'icon': '📝', 'description': 'Whiteboard with markers'},
            {'name': 'Video Conferencing', 'icon': '📹', 'description': 'Video conference setup'},
            {'name': 'Audio System', 'icon': '🎤', 'description': 'Sound system with microphones'},
            {'name': 'TV Screen', 'icon': '📺', 'description': 'Large TV screen'},
            {'name': 'Screen', 'icon': '🖥️', 'description': 'Projection screen'},
            {'name': 'Computers', 'icon': '💻', 'description': 'Computer workstations'},
            {'name': 'Internet Access', 'icon': '🌐', 'description': 'WiFi internet access'},
            {'name': 'Printers', 'icon': '🖨️', 'description': 'Printing facilities'},
            {'name': 'Air Conditioning', 'icon': '❄️', 'description': 'Climate control'},
            {'name': 'Natural Light', 'icon': '☀️', 'description': 'Windows with natural lighting'},
            {'name': 'Catering Setup', 'icon': '🍽️', 'description': 'Setup for food and beverages'},
        ]
        return defaults