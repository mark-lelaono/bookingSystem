"""
Room serializers for ICPAC Booking System
"""
from rest_framework import serializers
from .models import Room, RoomAmenity


class RoomAmenitySerializer(serializers.ModelSerializer):
    """
    Serializer for room amenities
    """
    class Meta:
        model = RoomAmenity
        fields = ['id', 'name', 'icon', 'description', 'is_active']
        read_only_fields = ['id']


class RoomSerializer(serializers.ModelSerializer):
    """
    Serializer for rooms
    """
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    amenities_list = serializers.CharField(source='get_amenities_list', read_only=True)
    is_large_room = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Room
        fields = [
            'id', 'name', 'capacity', 'category', 'category_display',
            'location', 'description', 'amenities', 'amenities_list',
            'image', 'is_active', 'is_large_room',
            'advance_booking_days', 'min_booking_duration', 'max_booking_duration',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_amenities(self, value):
        """Validate amenities list"""
        if not isinstance(value, list):
            raise serializers.ValidationError("Amenities must be a list.")
        
        # Get available amenities
        available_amenities = RoomAmenity.objects.filter(is_active=True).values_list('name', flat=True)
        
        # Check if all provided amenities are valid
        invalid_amenities = [amenity for amenity in value if amenity not in available_amenities]
        if invalid_amenities:
            raise serializers.ValidationError(
                f"Invalid amenities: {', '.join(invalid_amenities)}. "
                f"Available amenities: {', '.join(available_amenities)}"
            )
        
        return value


class RoomListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for room listings
    """
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    
    class Meta:
        model = Room
        fields = [
            'id', 'name', 'capacity', 'category', 'category_display',
            'location', 'amenities', 'image', 'is_active'
        ]


class RoomDetailSerializer(RoomSerializer):
    """
    Detailed room serializer with booking information
    """
    total_bookings = serializers.SerializerMethodField()
    upcoming_bookings = serializers.SerializerMethodField()
    
    class Meta(RoomSerializer.Meta):
        fields = RoomSerializer.Meta.fields + ['total_bookings', 'upcoming_bookings']
    
    def get_total_bookings(self, obj):
        """Get total number of bookings for this room"""
        return obj.bookings.filter(approval_status='approved').count()
    
    def get_upcoming_bookings(self, obj):
        """Get upcoming approved bookings for this room"""
        from django.utils import timezone
        
        upcoming = obj.bookings.filter(
            approval_status='approved',
            start_date__gte=timezone.now().date()
        ).order_by('start_date', 'start_time')[:5]
        
        # Return simple representation to avoid circular imports
        return [
            {
                'id': booking.id,
                'purpose': booking.purpose,
                'user_name': booking.user.get_full_name(),
                'start_date': booking.start_date,
                'start_time': booking.start_time,
                'end_time': booking.end_time,
                'expected_attendees': booking.expected_attendees,
            } for booking in upcoming
        ]


class RoomAvailabilitySerializer(serializers.Serializer):
    """
    Serializer for checking room availability
    """
    date = serializers.DateField(help_text='Date to check availability')
    start_time = serializers.TimeField(help_text='Start time', required=False)
    end_time = serializers.TimeField(help_text='End time', required=False)
    
    def validate(self, attrs):
        """Validate date and time combination"""
        from django.utils import timezone
        
        date = attrs.get('date')
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        
        # Check if date is not in the past
        if date < timezone.now().date():
            raise serializers.ValidationError({
                'date': 'Cannot check availability for past dates.'
            })
        
        # If times are provided, validate them
        if start_time and end_time:
            if start_time >= end_time:
                raise serializers.ValidationError({
                    'end_time': 'End time must be after start time.'
                })
        
        return attrs


class RoomBookingStatsSerializer(serializers.Serializer):
    """
    Serializer for room booking statistics
    """
    room_id = serializers.IntegerField()
    room_name = serializers.CharField()
    total_bookings = serializers.IntegerField()
    approved_bookings = serializers.IntegerField()
    pending_bookings = serializers.IntegerField()
    utilization_rate = serializers.FloatField()
    popular_time_slots = serializers.ListField()
    
    
class RoomCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating rooms (admin only)
    """
    class Meta:
        model = Room
        fields = [
            'name', 'capacity', 'category', 'location', 'description',
            'amenities', 'image', 'is_active',
            'advance_booking_days', 'min_booking_duration', 'max_booking_duration'
        ]
    
    def validate_name(self, value):
        """Validate room name uniqueness"""
        if self.instance:
            # Update case - exclude current instance
            if Room.objects.exclude(pk=self.instance.pk).filter(name=value).exists():
                raise serializers.ValidationError('A room with this name already exists.')
        else:
            # Create case
            if Room.objects.filter(name=value).exists():
                raise serializers.ValidationError('A room with this name already exists.')
        return value
    
    def validate_capacity(self, value):
        """Validate room capacity"""
        if value < 1:
            raise serializers.ValidationError('Room capacity must be at least 1.')
        if value > 1000:
            raise serializers.ValidationError('Room capacity cannot exceed 1000.')
        return value
    
    def validate(self, attrs):
        """Validate booking duration settings"""
        min_duration = attrs.get('min_booking_duration', 1)
        max_duration = attrs.get('max_booking_duration', 8)
        
        if min_duration >= max_duration:
            raise serializers.ValidationError({
                'max_booking_duration': 'Maximum duration must be greater than minimum duration.'
            })
        
        if attrs.get('advance_booking_days', 30) > 365:
            raise serializers.ValidationError({
                'advance_booking_days': 'Advance booking days cannot exceed 365.'
            })
        
        return attrs