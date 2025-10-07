"""
Room views for ICPAC Booking System
"""
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Q, Count, Avg
from datetime import datetime, timedelta
from .models import Room, RoomAmenity
from .serializers import (
    RoomSerializer,
    RoomListSerializer,
    RoomDetailSerializer,
    RoomAmenitySerializer,
    RoomAvailabilitySerializer,
    RoomBookingStatsSerializer,
    RoomCreateUpdateSerializer
)


class RoomListView(generics.ListCreateAPIView):
    """
    List all rooms or create a new room
    """
    queryset = Room.objects.filter(is_active=True).order_by('name')
    permission_classes = [permissions.AllowAny]  # Allow public access to view rooms
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return RoomCreateUpdateSerializer
        return RoomListSerializer
    
    def get_queryset(self):
        queryset = Room.objects.filter(is_active=True).order_by('name')
        
        # Filter by category
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Filter by capacity (minimum)
        min_capacity = self.request.query_params.get('min_capacity')
        if min_capacity:
            try:
                queryset = queryset.filter(capacity__gte=int(min_capacity))
            except ValueError:
                pass
        
        # Filter by amenities
        amenities = self.request.query_params.getlist('amenities')
        if amenities:
            for amenity in amenities:
                queryset = queryset.filter(amenities__icontains=amenity)
        
        # Search by name or location
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(location__icontains=search) |
                Q(description__icontains=search)
            )
        
        return queryset
    
    def perform_create(self, serializer):
        # Only authenticated super admin and room admin can create rooms
        if not self.request.user.is_authenticated:
            raise permissions.PermissionDenied('Authentication required to create rooms.')
        if self.request.user.role not in ['super_admin', 'room_admin']:
            raise permissions.PermissionDenied('Only admins can create rooms.')
        
        serializer.save()


class RoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a room
    """
    queryset = Room.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return RoomCreateUpdateSerializer
        return RoomDetailSerializer
    
    def perform_update(self, serializer):
        # Only super admin and room admin can update rooms
        if self.request.user.role not in ['super_admin', 'room_admin']:
            raise permissions.PermissionDenied('Only admins can update rooms.')
        
        serializer.save()
    
    def perform_destroy(self, instance):
        # Only super admin can delete rooms
        if self.request.user.role != 'super_admin':
            raise permissions.PermissionDenied('Only super admins can delete rooms.')
        
        # Soft delete - just mark as inactive
        instance.is_active = False
        instance.save()


class RoomAmenityListView(generics.ListCreateAPIView):
    """
    List all amenities or create a new amenity
    """
    queryset = RoomAmenity.objects.filter(is_active=True).order_by('name')
    serializer_class = RoomAmenitySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        # Only super admin can create amenities
        if self.request.user.role != 'super_admin':
            raise permissions.PermissionDenied('Only super admins can create amenities.')
        
        serializer.save()


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def check_room_availability(request, room_id):
    """
    Check if a room is available for booking
    """
    try:
        room = Room.objects.get(id=room_id, is_active=True)
    except Room.DoesNotExist:
        return Response(
            {'error': 'Room not found.'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = RoomAvailabilitySerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    date = serializer.validated_data['date']
    start_time = serializer.validated_data.get('start_time')
    end_time = serializer.validated_data.get('end_time')
    
    # Get availability for the entire day or specific time slot
    availability_data = room.get_availability_for_date(date, start_time, end_time)
    
    return Response({
        'room_id': room.id,
        'room_name': room.name,
        'date': date,
        'availability': availability_data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def room_booking_stats(request, room_id):
    """
    Get booking statistics for a specific room
    """
    try:
        room = Room.objects.get(id=room_id)
    except Room.DoesNotExist:
        return Response(
            {'error': 'Room not found.'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Only room admin can view stats for their rooms, or super admin
    if (request.user.role == 'room_admin' and 
        room not in request.user.managed_rooms.all() and 
        request.user.role != 'super_admin'):
        raise permissions.PermissionDenied('You can only view stats for rooms you manage.')
    
    # Get date range (default: last 30 days)
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)
    
    # Get query params for custom date range
    start_param = request.query_params.get('start_date')
    end_param = request.query_params.get('end_date')
    
    if start_param:
        try:
            start_date = datetime.strptime(start_param, '%Y-%m-%d').date()
        except ValueError:
            pass
    
    if end_param:
        try:
            end_date = datetime.strptime(end_param, '%Y-%m-%d').date()
        except ValueError:
            pass
    
    # Get bookings in date range
    bookings = room.bookings.filter(
        start_date__range=[start_date, end_date]
    )
    
    total_bookings = bookings.count()
    approved_bookings = bookings.filter(approval_status='approved').count()
    pending_bookings = bookings.filter(approval_status='pending').count()
    
    # Calculate utilization rate (simplified)
    total_days = (end_date - start_date).days + 1
    working_hours_per_day = 8  # Assume 8 working hours per day
    total_available_hours = total_days * working_hours_per_day
    
    # Sum up approved booking durations
    total_booked_hours = 0
    for booking in bookings.filter(approval_status='approved'):
        duration = booking.get_duration_hours()
        total_booked_hours += duration
    
    utilization_rate = (total_booked_hours / total_available_hours * 100) if total_available_hours > 0 else 0
    
    # Get popular time slots
    popular_slots = bookings.filter(approval_status='approved').values(
        'start_time'
    ).annotate(
        count=Count('id')
    ).order_by('-count')[:5]
    
    popular_time_slots = [
        f"{slot['start_time'].strftime('%H:%M')} ({slot['count']} bookings)"
        for slot in popular_slots
    ]
    
    stats_data = {
        'room_id': room.id,
        'room_name': room.name,
        'total_bookings': total_bookings,
        'approved_bookings': approved_bookings,
        'pending_bookings': pending_bookings,
        'utilization_rate': round(utilization_rate, 2),
        'popular_time_slots': popular_time_slots,
        'date_range': {
            'start_date': start_date,
            'end_date': end_date
        }
    }
    
    return Response(stats_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def rooms_overview_stats(request):
    """
    Get overview statistics for all rooms (admin only)
    """
    if request.user.role not in ['super_admin', 'room_admin']:
        raise permissions.PermissionDenied('Only admins can view room statistics.')
    
    # Get rooms based on user role
    if request.user.role == 'super_admin':
        rooms = Room.objects.filter(is_active=True)
    else:
        # Room admin can only see their managed rooms
        rooms = request.user.managed_rooms.filter(is_active=True)
    
    # Calculate overall stats
    total_rooms = rooms.count()
    
    # Get booking stats for last 30 days
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)
    
    from apps.bookings.models import Booking
    
    if request.user.role == 'super_admin':
        recent_bookings = Booking.objects.filter(
            start_date__range=[start_date, end_date]
        )
    else:
        room_ids = rooms.values_list('id', flat=True)
        recent_bookings = Booking.objects.filter(
            room_id__in=room_ids,
            start_date__range=[start_date, end_date]
        )
    
    total_bookings = recent_bookings.count()
    approved_bookings = recent_bookings.filter(approval_status='approved').count()
    pending_bookings = recent_bookings.filter(approval_status='pending').count()
    
    # Room utilization by category
    room_stats = []
    for room in rooms.order_by('name'):
        room_bookings = recent_bookings.filter(room=room, approval_status='approved')
        
        # Calculate utilization
        total_days = (end_date - start_date).days + 1
        working_hours_per_day = 8
        total_available_hours = total_days * working_hours_per_day
        
        total_booked_hours = sum([
            booking.get_duration_hours() for booking in room_bookings
        ])
        
        utilization_rate = (total_booked_hours / total_available_hours * 100) if total_available_hours > 0 else 0
        
        room_stats.append({
            'id': room.id,
            'name': room.name,
            'category': room.category,
            'capacity': room.capacity,
            'total_bookings': room_bookings.count(),
            'utilization_rate': round(utilization_rate, 2)
        })
    
    # Sort by utilization rate (most used first)
    room_stats.sort(key=lambda x: x['utilization_rate'], reverse=True)
    
    overview = {
        'total_rooms': total_rooms,
        'total_bookings_last_30_days': total_bookings,
        'approved_bookings_last_30_days': approved_bookings,
        'pending_bookings_last_30_days': pending_bookings,
        'room_statistics': room_stats,
        'date_range': {
            'start_date': start_date,
            'end_date': end_date
        }
    }
    
    return Response(overview)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def room_categories(request):
    """
    Get available room categories with counts
    """
    from django.db import models
    
    categories = Room.objects.filter(is_active=True).values(
        'category'
    ).annotate(
        count=Count('id'),
        avg_capacity=Avg('capacity')
    ).order_by('category')
    
    category_data = []
    for cat in categories:
        # Get display name for category
        category_display = dict(Room.CATEGORY_CHOICES).get(cat['category'], cat['category'])
        
        category_data.append({
            'category': cat['category'],
            'category_display': category_display,
            'count': cat['count'],
            'average_capacity': round(cat['avg_capacity'] or 0, 1)
        })
    
    return Response({
        'categories': category_data,
        'total_categories': len(category_data)
    })
