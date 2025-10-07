"""
Booking views for ICPAC Booking System
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count, Avg
from datetime import datetime, timedelta, time
import logging

logger = logging.getLogger(__name__)
from .models import Booking
from apps.rooms.models import Room
from .serializers import (
    BookingSerializer,
    BookingListSerializer,
    BookingCreateUpdateSerializer,
    BookingApprovalSerializer,
    BookingStatsSerializer,
    DashboardStatsSerializer
)


class BookingListView(generics.ListCreateAPIView):
    """
    List all bookings or create a new booking
    """
    def get_permissions(self):
        """
        Allow anonymous read access, require authentication for create
        """
        if self.request.method == 'GET':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return BookingCreateUpdateSerializer
        return BookingListSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = Booking.objects.all().order_by('-created_at')

        # Handle anonymous users (for public booking view)
        if not user.is_authenticated:
            # Anonymous users can see all bookings for demo purposes
            return queryset

        # Filter based on user role for authenticated users
        if hasattr(user, 'role') and user.role == 'super_admin':
            # Super admin can see all bookings
            pass
        elif hasattr(user, 'role') and user.role == 'room_admin':
            # Room admin can see bookings for their managed rooms
            managed_room_ids = user.managed_rooms.values_list('id', flat=True)
            queryset = queryset.filter(
                Q(room_id__in=managed_room_ids) | Q(user=user)
            )
        else:
            # Regular users can only see their own bookings
            queryset = queryset.filter(user=user)
        
        # Apply filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(approval_status=status_filter)
        
        room_id = self.request.query_params.get('room')
        if room_id:
            try:
                queryset = queryset.filter(room_id=int(room_id))
            except ValueError:
                pass
        
        date_from = self.request.query_params.get('date_from')
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(start_date__gte=date_from)
            except ValueError:
                pass
        
        date_to = self.request.query_params.get('date_to')
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(end_date__lte=date_to)
            except ValueError:
                pass
        
        return queryset


class BookingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a booking
    """
    queryset = Booking.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return BookingCreateUpdateSerializer
        return BookingSerializer
    
    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'super_admin':
            return Booking.objects.all()
        elif user.role == 'room_admin':
            managed_room_ids = user.managed_rooms.values_list('id', flat=True)
            return Booking.objects.filter(
                Q(room_id__in=managed_room_ids) | Q(user=user)
            )
        else:
            return Booking.objects.filter(user=user)
    
    def perform_update(self, serializer):
        booking = self.get_object()
        
        # Check if user can modify this booking
        if not booking.can_be_modified_by(self.request.user):
            raise permissions.PermissionDenied('You cannot modify this booking.')
        
        # Reset approval status if booking is modified
        if booking.approval_status == 'approved':
            serializer.save(
                approval_status='pending',
                approved_by=None,
                approved_at=None,
                rejection_reason=''
            )
        else:
            serializer.save()
    
    def perform_destroy(self, instance):
        # Check if user can delete this booking
        if not instance.can_be_modified_by(self.request.user):
            raise permissions.PermissionDenied('You cannot delete this booking.')
        
        # Soft delete - mark as cancelled
        instance.approval_status = 'cancelled'
        instance.save()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_reject_booking(request, booking_id):
    """
    Approve or reject a booking
    """
    try:
        booking = Booking.objects.get(id=booking_id)
    except Booking.DoesNotExist:
        return Response(
            {'error': 'Booking not found.'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check permissions
    if not booking.can_approve_booking(request.user):
        raise permissions.PermissionDenied('You do not have permission to approve/reject this booking.')
    
    serializer = BookingApprovalSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    action = serializer.validated_data['action']
    rejection_reason = serializer.validated_data.get('rejection_reason', '')
    
    if action == 'approve':
        booking.approve(request.user)
        message = f'Booking approved successfully.'
    else:
        booking.reject(request.user, rejection_reason)
        message = f'Booking rejected successfully.'
    
    return Response({
        'message': message,
        'booking': BookingSerializer(booking).data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def my_bookings(request):
    """
    Get current user's bookings
    """
    user = request.user
    
    # Get upcoming bookings
    upcoming = Booking.objects.filter(
        user=user,
        start_date__gte=timezone.now().date()
    ).order_by('start_date', 'start_time')[:5]
    
    # Get recent bookings
    recent = Booking.objects.filter(user=user).order_by('-created_at')[:10]
    
    # Get statistics
    total = Booking.objects.filter(user=user).count()
    approved = Booking.objects.filter(user=user, approval_status='approved').count()
    pending = Booking.objects.filter(user=user, approval_status='pending').count()
    
    return Response({
        'upcoming_bookings': BookingListSerializer(upcoming, many=True).data,
        'recent_bookings': BookingListSerializer(recent, many=True).data,
        'statistics': {
            'total_bookings': total,
            'approved_bookings': approved,
            'pending_bookings': pending
        }
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def pending_approvals(request):
    """
    Get bookings pending approval (admin only)
    """
    user = request.user
    
    if user.role not in ['super_admin', 'room_admin']:
        raise permissions.PermissionDenied('Only admins can view pending approvals.')
    
    # Get pending bookings based on user role
    if user.role == 'super_admin':
        pending_bookings = Booking.objects.filter(approval_status='pending')
    else:
        # Room admin can only see bookings for their managed rooms
        managed_room_ids = user.managed_rooms.values_list('id', flat=True)
        pending_bookings = Booking.objects.filter(
            approval_status='pending',
            room_id__in=managed_room_ids
        )
    
    pending_bookings = pending_bookings.order_by('created_at')
    
    return Response({
        'pending_bookings': BookingSerializer(pending_bookings, many=True).data,
        'count': pending_bookings.count()
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def booking_dashboard_stats(request):
    """
    Get booking dashboard statistics
    """
    user = request.user
    
    # Base queryset based on user role
    if user.role == 'super_admin':
        all_bookings = Booking.objects.all()
    elif user.role == 'room_admin':
        managed_room_ids = user.managed_rooms.values_list('id', flat=True)
        all_bookings = Booking.objects.filter(room_id__in=managed_room_ids)
    else:
        all_bookings = Booking.objects.filter(user=user)
    
    # Get date range (default: last 30 days)
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)
    
    recent_bookings = all_bookings.filter(
        start_date__range=[start_date, end_date]
    )
    
    # Calculate statistics
    stats = {
        'total_bookings': all_bookings.count(),
        'recent_bookings_count': recent_bookings.count(),
        'approved_bookings': all_bookings.filter(approval_status='approved').count(),
        'pending_bookings': all_bookings.filter(approval_status='pending').count(),
        'rejected_bookings': all_bookings.filter(approval_status='rejected').count(),
    }
    
    # Add admin-specific stats
    if user.role in ['super_admin', 'room_admin']:
        today = timezone.now().date()
        
        stats.update({
            'todays_bookings': all_bookings.filter(
                start_date=today,
                approval_status='approved'
            ).count(),
            'this_week_bookings': all_bookings.filter(
                start_date__range=[today, today + timedelta(days=7)],
                approval_status='approved'
            ).count(),
        })
        
        # Most popular room
        popular_room = all_bookings.filter(
            approval_status='approved'
        ).values('room__name').annotate(
            count=Count('id')
        ).order_by('-count').first()
        
        stats['most_popular_room'] = popular_room['room__name'] if popular_room else 'N/A'
    
    # Recent bookings for timeline
    recent_list = recent_bookings.order_by('-created_at')[:10]
    
    return Response({
        'statistics': stats,
        'recent_bookings': BookingListSerializer(recent_list, many=True).data,
        'date_range': {
            'start_date': start_date,
            'end_date': end_date
        }
    })




@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def check_availability(request):
    """
    Check room availability for specific date and time
    """
    room_id = request.data.get('room_id')
    start_date = request.data.get('start_date')
    end_date = request.data.get('end_date')
    start_time = request.data.get('start_time')
    end_time = request.data.get('end_time')

    # Validate required fields
    if not all([room_id, start_date, start_time, end_time]):
        return Response(
            {'error': 'room_id, start_date, start_time, and end_time are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Set end_date to start_date if not provided
    if not end_date:
        end_date = start_date

    try:
        # Parse dates and times
        start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        start_time = datetime.strptime(start_time, '%H:%M').time()
        end_time = datetime.strptime(end_time, '%H:%M').time()

        # Get the room
        try:
            room = Room.objects.get(id=room_id)
        except Room.DoesNotExist:
            return Response(
                {'error': 'Room not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if room is active
        if not room.is_active:
            return Response({
                'available': False,
                'reason': 'Room is currently unavailable for booking.'
            })

        # Validate date is not in the past
        if start_date < timezone.now().date():
            return Response({
                'available': False,
                'reason': 'Cannot book rooms for past dates.'
            })

        # Check if booking is within advance booking limit
        max_booking_date = timezone.now().date() + timedelta(days=room.advance_booking_days)
        if start_date > max_booking_date:
            return Response({
                'available': False,
                'reason': f'Cannot book more than {room.advance_booking_days} days in advance.'
            })

        # Calculate duration and validate
        duration = datetime.combine(start_date, end_time) - datetime.combine(start_date, start_time)
        duration_hours = duration.total_seconds() / 3600

        if duration_hours < room.min_booking_duration:
            return Response({
                'available': False,
                'reason': f'Minimum booking duration is {room.min_booking_duration} hours.'
            })

        if duration_hours > room.max_booking_duration:
            return Response({
                'available': False,
                'reason': f'Maximum booking duration is {room.max_booking_duration} hours.'
            })

        # Get availability level for the room on this date
        availability_level = room.get_availability_level(start_date)

        # Check for conflicting bookings
        conflicting_bookings = Booking.objects.filter(
            room=room,
            approval_status__in=['approved', 'pending'],
            start_date__lte=end_date,
            end_date__gte=start_date
        )

        # Check time overlap for bookings on the same day
        conflicts = []
        for booking in conflicting_bookings:
            # Check if there's a time overlap
            if (booking.start_time < end_time and booking.end_time > start_time):
                conflicts.append({
                    'id': booking.id,
                    'purpose': booking.purpose,
                    'user': booking.user.get_full_name() if booking.user else 'Unknown',
                    'start_time': booking.start_time.strftime('%H:%M'),
                    'end_time': booking.end_time.strftime('%H:%M'),
                    'start_date': booking.start_date.strftime('%Y-%m-%d'),
                    'end_date': booking.end_date.strftime('%Y-%m-%d'),
                    'status': booking.approval_status
                })

        if conflicts:
            return Response({
                'available': False,
                'availability_level': availability_level,
                'reason': 'Time slot conflicts with existing bookings.',
                'conflicts': conflicts
            })

        # Get available time slots for the day
        available_slots = get_available_time_slots(room, start_date)

        return Response({
            'available': True,
            'availability_level': availability_level,
            'room': {
                'id': room.id,
                'name': room.name,
                'capacity': room.capacity,
                'amenities': room.amenities,
                'min_duration': room.min_booking_duration,
                'max_duration': room.max_booking_duration
            },
            'requested_slot': {
                'start_date': start_date.strftime('%Y-%m-%d'),
                'end_date': end_date.strftime('%Y-%m-%d'),
                'start_time': start_time.strftime('%H:%M'),
                'end_time': end_time.strftime('%H:%M'),
                'duration_hours': duration_hours
            },
            'available_slots': available_slots
        })

    except ValueError as e:
        return Response(
            {'error': f'Invalid date/time format: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_rooms_availability_levels(request):
    """
    Get availability levels for all rooms on a specific date
    """
    date_str = request.query_params.get('date')

    if not date_str:
        return Response(
            {'error': 'date parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        date = datetime.strptime(date_str, '%Y-%m-%d').date()
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD'},
            status=status.HTTP_400_BAD_REQUEST
        )

    rooms = Room.objects.filter(is_active=True)
    availability_data = []

    for room in rooms:
        level = room.get_availability_level(date)
        availability_data.append({
            'room_id': room.id,
            'room_name': room.name,
            'availability_level': level,
            'color': {
                'available': 'green',
                'partially_booked': 'orange',
                'fully_booked': 'red'
            }.get(level, 'gray')
        })

    return Response({
        'date': date_str,
        'rooms': availability_data
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_room_schedule(request, room_id):
    """
    Get the schedule of a specific room for a date range
    """
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response(
            {'error': 'Room not found.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Get date range from query params
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')

    if not start_date:
        start_date = timezone.now().date()
    else:
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid start_date format. Use YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    if not end_date:
        end_date = start_date + timedelta(days=7)  # Default to one week
    else:
        try:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': 'Invalid end_date format. Use YYYY-MM-DD.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    # Get bookings for the room in the date range
    bookings = Booking.objects.filter(
        room=room,
        approval_status__in=['approved', 'pending'],
        start_date__lte=end_date,
        end_date__gte=start_date
    ).order_by('start_date', 'start_time')

    # Format the schedule
    schedule = {}
    current_date = start_date
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        day_bookings = []

        for booking in bookings:
            if booking.start_date <= current_date <= booking.end_date:
                day_bookings.append({
                    'id': booking.id,
                    'purpose': booking.purpose,
                    'start_time': booking.start_time.strftime('%H:%M'),
                    'end_time': booking.end_time.strftime('%H:%M'),
                    'user': booking.user.get_full_name() if booking.user else 'Unknown',
                    'status': booking.approval_status,
                    'attendees': booking.expected_attendees
                })

        # Get available slots for this day
        available_slots = get_available_time_slots(room, current_date, existing_bookings=day_bookings)

        schedule[date_str] = {
            'date': date_str,
            'day_name': current_date.strftime('%A'),
            'bookings': day_bookings,
            'available_slots': available_slots,
            'is_fully_booked': len(available_slots) == 0
        }

        current_date += timedelta(days=1)

    return Response({
        'room': {
            'id': room.id,
            'name': room.name,
            'capacity': room.capacity,
            'category': room.category,
            'amenities': room.amenities
        },
        'date_range': {
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d')
        },
        'schedule': schedule
    })


def get_available_time_slots(room, date, existing_bookings=None):
    """
    Helper function to get available time slots for a room on a specific date
    """
    # Define business hours (8 AM to 6 PM)
    business_start = time(8, 0)
    business_end = time(18, 0)

    if existing_bookings is None:
        # Get all bookings for this room on this date
        bookings = Booking.objects.filter(
            room=room,
            approval_status__in=['approved', 'pending'],
            start_date__lte=date,
            end_date__gte=date
        ).order_by('start_time')
    else:
        bookings = existing_bookings

    available_slots = []
    current_time = business_start

    for booking in bookings:
        if isinstance(booking, dict):
            # Handle when bookings are already formatted as dicts
            booking_start = datetime.strptime(booking['start_time'], '%H:%M').time()
            booking_end = datetime.strptime(booking['end_time'], '%H:%M').time()
        else:
            booking_start = booking.start_time
            booking_end = booking.end_time

        # If there's a gap before this booking, add it as available
        if current_time < booking_start:
            duration_hours = (datetime.combine(date, booking_start) - datetime.combine(date, current_time)).total_seconds() / 3600
            if duration_hours >= room.min_booking_duration:
                available_slots.append({
                    'start_time': current_time.strftime('%H:%M'),
                    'end_time': booking_start.strftime('%H:%M'),
                    'duration_hours': duration_hours
                })

        # Move current time to end of this booking
        if booking_end > current_time:
            current_time = booking_end

    # Check if there's time available after the last booking
    if current_time < business_end:
        duration_hours = (datetime.combine(date, business_end) - datetime.combine(date, current_time)).total_seconds() / 3600
        if duration_hours >= room.min_booking_duration:
            available_slots.append({
                'start_time': current_time.strftime('%H:%M'),
                'end_time': business_end.strftime('%H:%M'),
                'duration_hours': duration_hours
            })

    return available_slots


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def quick_book(request):
    """
    Quick booking endpoint for immediate room reservation
    """
    serializer = BookingCreateUpdateSerializer(data=request.data, context={'request': request})

    if serializer.is_valid():
        booking = serializer.save()

        # Send notification (implement notification system if needed)
        logger.info(f"Quick booking created: {booking.id} by user {request.user.id}")

        return Response({
            'message': 'Booking created successfully',
            'booking': BookingSerializer(booking, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def available_rooms(request):
    """
    Get list of available rooms for a specific date and time
    """
    date = request.query_params.get('date')
    start_time = request.query_params.get('start_time')
    end_time = request.query_params.get('end_time')
    capacity = request.query_params.get('min_capacity')
    category = request.query_params.get('category')

    if not all([date, start_time, end_time]):
        return Response(
            {'error': 'date, start_time, and end_time are required.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        date = datetime.strptime(date, '%Y-%m-%d').date()
        start_time = datetime.strptime(start_time, '%H:%M').time()
        end_time = datetime.strptime(end_time, '%H:%M').time()
    except ValueError:
        return Response(
            {'error': 'Invalid date/time format.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Start with all active rooms
    available_rooms_list = Room.objects.filter(is_active=True)

    # Filter by capacity if specified
    if capacity:
        try:
            available_rooms_list = available_rooms_list.filter(capacity__gte=int(capacity))
        except ValueError:
            pass

    # Filter by category if specified
    if category:
        available_rooms_list = available_rooms_list.filter(category=category)

    # Check each room for availability
    available = []
    for room in available_rooms_list:
        # Check for conflicting bookings
        conflicts = Booking.objects.filter(
            room=room,
            approval_status__in=['approved', 'pending'],
            start_date__lte=date,
            end_date__gte=date,
            start_time__lt=end_time,
            end_time__gt=start_time
        ).exists()

        if not conflicts:
            available.append({
                'id': room.id,
                'name': room.name,
                'capacity': room.capacity,
                'category': room.category,
                'category_display': room.category_display,
                'floor': room.floor,
                'amenities': room.amenities,
                'image': room.image.url if room.image else None
            })

    return Response({
        'date': date.strftime('%Y-%m-%d'),
        'start_time': start_time.strftime('%H:%M'),
        'end_time': end_time.strftime('%H:%M'),
        'available_rooms': available,
        'total_available': len(available)
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def calendar_events(request):
    """
    Get booking events for calendar display
    """
    user = request.user
    
    # Get date range from query params
    start_date = request.query_params.get('start')
    end_date = request.query_params.get('end')
    
    try:
        if start_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
        else:
            start_date = timezone.now().date()
        
        if end_date:
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        else:
            end_date = start_date + timedelta(days=30)
    except ValueError:
        return Response(
            {'error': 'Invalid date format. Use YYYY-MM-DD.'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get bookings based on user role
    if user.role == 'super_admin':
        bookings = Booking.objects.filter(
            start_date__lte=end_date,
            end_date__gte=start_date,
            approval_status='approved'
        )
    elif user.role == 'room_admin':
        managed_room_ids = user.managed_rooms.values_list('id', flat=True)
        bookings = Booking.objects.filter(
            Q(room_id__in=managed_room_ids) | Q(user=user),
            start_date__lte=end_date,
            end_date__gte=start_date,
            approval_status='approved'
        )
    else:
        bookings = Booking.objects.filter(
            user=user,
            start_date__lte=end_date,
            end_date__gte=start_date
        )
    
    # Format events for calendar
    events = []
    for booking in bookings:
        events.append({
            'id': booking.id,
            'title': f"{booking.room.name} - {booking.purpose}",
            'start': f"{booking.start_date}T{booking.start_time}",
            'end': f"{booking.end_date}T{booking.end_time}",
            'backgroundColor': {
                'approved': '#28a745',
                'pending': '#ffc107',
                'rejected': '#dc3545',
                'cancelled': '#6c757d'
            }.get(booking.approval_status, '#007bff'),
            'extendedProps': {
                'room': booking.room.name,
                'user': booking.user.get_full_name(),
                'status': booking.approval_status,
                'attendees': booking.expected_attendees
            }
        })
    
    return Response({
        'events': events,
        'total_events': len(events)
    })
