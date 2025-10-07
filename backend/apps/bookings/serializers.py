"""
Booking serializers for ICPAC Booking System
"""
from rest_framework import serializers
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Booking
from apps.rooms.models import Room
from django.contrib.auth import get_user_model

User = get_user_model()


class BookingSerializer(serializers.ModelSerializer):
    """
    Serializer for bookings
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    room_id = serializers.IntegerField(source='room.id', read_only=True)  # Add explicit room_id field
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    duration_hours = serializers.SerializerMethodField()
    can_modify = serializers.SerializerMethodField()
    
    class Meta:
        model = Booking
        fields = [
            'id', 'room', 'room_id', 'room_name', 'user', 'user_name',
            'start_date', 'end_date', 'start_time', 'end_time',
            'purpose', 'expected_attendees', 'special_requirements',
            'booking_type', 'approval_status', 'approval_status_display', 'approved_by',
            'approved_at', 'rejection_reason', 'duration_hours',
            'can_modify', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'user', 'approval_status', 'approved_by', 'approved_at',
            'rejection_reason', 'created_at', 'updated_at'
        ]
    
    def get_duration_hours(self, obj):
        """Get booking duration in hours"""
        return obj.get_duration_hours()
    
    def get_can_modify(self, obj):
        """Check if current user can modify this booking"""
        request = self.context.get('request')
        if request and request.user:
            return obj.can_be_modified_by(request.user)
        return False
    
    def validate(self, attrs):
        """Validate booking data"""
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date', start_date)
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        room = attrs.get('room')
        expected_attendees = attrs.get('expected_attendees', 1)
        
        # Basic date/time validation
        if start_date < timezone.now().date():
            raise serializers.ValidationError({
                'start_date': 'Cannot book rooms for past dates.'
            })
        
        if end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date cannot be before start date.'
            })
        
        if start_time >= end_time:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time.'
            })
        
        # Room capacity validation
        if room and expected_attendees > room.capacity:
            raise serializers.ValidationError({
                'expected_attendees': f'Number of attendees ({expected_attendees}) exceeds room capacity ({room.capacity}).'
            })
        
        # Advance booking validation
        if room:
            max_advance_days = room.advance_booking_days
            max_booking_date = timezone.now().date() + timedelta(days=max_advance_days)
            if start_date > max_booking_date:
                raise serializers.ValidationError({
                    'start_date': f'Cannot book more than {max_advance_days} days in advance.'
                })
        
        # Duration validation
        duration = datetime.combine(start_date, end_time) - datetime.combine(start_date, start_time)
        duration_hours = duration.total_seconds() / 3600
        
        if room:
            if duration_hours < room.min_booking_duration:
                raise serializers.ValidationError({
                    'end_time': f'Minimum booking duration is {room.min_booking_duration} hours.'
                })
            
            if duration_hours > room.max_booking_duration:
                raise serializers.ValidationError({
                    'end_time': f'Maximum booking duration is {room.max_booking_duration} hours.'
                })
        
        # Check for overlapping bookings
        if room:
            overlapping_bookings = Booking.objects.filter(
                room=room,
                approval_status__in=['approved', 'pending'],
                start_date__lte=end_date,
                end_date__gte=start_date,
                start_time__lt=end_time,
                end_time__gt=start_time
            )
            
            # Exclude current instance if updating
            if self.instance:
                overlapping_bookings = overlapping_bookings.exclude(pk=self.instance.pk)
            
            if overlapping_bookings.exists():
                raise serializers.ValidationError({
                    'non_field_errors': 'This time slot conflicts with an existing booking.'
                })
        
        return attrs


class BookingListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for booking listings
    """
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    room_name = serializers.CharField(source='room.name', read_only=True)
    room_id = serializers.IntegerField(source='room.id', read_only=True)  # Add room ID for frontend matching
    approval_status_display = serializers.CharField(source='get_approval_status_display', read_only=True)
    
    class Meta:
        model = Booking
        fields = [
            'id', 'room_id', 'room_name', 'user_name', 'start_date', 'end_date',
            'start_time', 'end_time', 'purpose', 'expected_attendees',
            'booking_type', 'approval_status', 'approval_status_display'
        ]


class BookingCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating bookings
    """
    selected_dates = serializers.ListField(
        child=serializers.CharField(max_length=10),
        required=False,
        allow_empty=True,
        allow_null=True,
        help_text='Array of selected dates for multi-day bookings (YYYY-MM-DD format)'
    )

    class Meta:
        model = Booking
        fields = [
            'room', 'start_date', 'end_date', 'start_time', 'end_time',
            'purpose', 'expected_attendees', 'special_requirements',
            'booking_type', 'selected_dates', 'approval_status', 'approved_by', 'approved_at'
        ]
        read_only_fields = ['approval_status', 'approved_by', 'approved_at']

    def validate(self, attrs):
        """Validate booking data"""
        from datetime import datetime

        booking_type = attrs.get('booking_type', 'hourly')
        selected_dates = attrs.get('selected_dates', [])

        # For multi_day with selected_dates, auto-populate start_date and end_date
        if booking_type == 'multi_day' and selected_dates and len(selected_dates) > 0:
            # Convert string dates to date objects
            date_objects = [datetime.strptime(d, '%Y-%m-%d').date() if isinstance(d, str) else d for d in selected_dates]
            attrs['start_date'] = min(date_objects)
            attrs['end_date'] = max(date_objects)

        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date', start_date)
        start_time = attrs.get('start_time')
        end_time = attrs.get('end_time')
        room = attrs.get('room')
        expected_attendees = attrs.get('expected_attendees', 1)

        # Basic validations
        if start_date < timezone.now().date():
            raise serializers.ValidationError({
                'start_date': 'Cannot book rooms for past dates.'
            })
        
        if end_date < start_date:
            raise serializers.ValidationError({
                'end_date': 'End date cannot be before start date.'
            })
        
        if start_time >= end_time:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time.'
            })
        
        # Room validation
        if room and not room.is_active:
            raise serializers.ValidationError({
                'room': 'This room is currently unavailable.'
            })
        
        if room and expected_attendees > room.capacity:
            raise serializers.ValidationError({
                'expected_attendees': f'Exceeds room capacity ({room.capacity}).'
            })
        
        # Check overlapping bookings
        if room:
            overlapping = Booking.objects.filter(
                room=room,
                approval_status__in=['approved', 'pending'],
                start_date__lte=end_date,
                end_date__gte=start_date,
                start_time__lt=end_time,
                end_time__gt=start_time
            )
            
            if self.instance:
                overlapping = overlapping.exclude(pk=self.instance.pk)
            
            if overlapping.exists():
                raise serializers.ValidationError({
                    'non_field_errors': 'Time slot is already booked.'
                })
        
        return attrs
    
    def create(self, validated_data):
        """Create booking with current user and auto-approve if no conflicts"""
        request = self.context.get('request')
        validated_data['user'] = request.user

        # Debug logging for weekly bookings
        if validated_data.get('booking_type') == 'weekly':
            print(f"DEBUG Weekly booking dates: start={validated_data.get('start_date')}, end={validated_data.get('end_date')}")
            if validated_data.get('start_date') and validated_data.get('end_date'):
                duration = (validated_data['end_date'] - validated_data['start_date']).days + 1
                print(f"DEBUG Duration calculation: {duration} days")

        # Auto-approve bookings since validation already checked for conflicts
        validated_data['approval_status'] = 'approved'
        validated_data['approved_by'] = request.user
        validated_data['approved_at'] = timezone.now()

        return super().create(validated_data)


class BookingApprovalSerializer(serializers.Serializer):
    """
    Serializer for booking approval/rejection
    """
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    rejection_reason = serializers.CharField(
        required=False, 
        allow_blank=True,
        help_text='Required when rejecting a booking'
    )
    
    def validate(self, attrs):
        action = attrs.get('action')
        rejection_reason = attrs.get('rejection_reason', '').strip()
        
        if action == 'reject' and not rejection_reason:
            raise serializers.ValidationError({
                'rejection_reason': 'Rejection reason is required when rejecting a booking.'
            })
        
        return attrs




class BookingStatsSerializer(serializers.Serializer):
    """
    Serializer for booking statistics
    """
    total_bookings = serializers.IntegerField()
    approved_bookings = serializers.IntegerField()
    pending_bookings = serializers.IntegerField()
    rejected_bookings = serializers.IntegerField()
    cancelled_bookings = serializers.IntegerField()
    most_popular_room = serializers.CharField()
    busiest_day = serializers.CharField()
    average_duration = serializers.FloatField()
    
    
class DashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics
    """
    user_bookings = BookingStatsSerializer()
    system_stats = serializers.DictField(required=False)
    recent_bookings = BookingListSerializer(many=True)
    upcoming_bookings = BookingListSerializer(many=True)