from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Q
from django.db import models
from .models import Room, RoomAmenity


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    """
    Admin interface for Room management
    """
    list_display = (
        'name', 'category_badge', 'capacity_display', 'floor', 
        'is_active', 'bookings_count', 'amenities_display'
    )
    
    list_filter = (
        'category', 'is_active', 'floor', 'capacity', 'created_at'
    )
    
    search_fields = ('name', 'description', 'location', 'amenities')
    ordering = ('name',)
    
    readonly_fields = ('created_at', 'updated_at')
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'category', 'description')
        }),
        ('Location & Capacity', {
            'fields': ('floor', 'location', 'capacity')
        }),
        ('Features & Amenities', {
            'fields': ('amenities', 'image')
        }),
        ('Booking Settings', {
            'fields': (
                'is_active', 'advance_booking_days', 
                'min_booking_duration', 'max_booking_duration'
            )
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )
    
    def get_queryset(self, request):
        """Optimize queryset with booking counts"""
        return super().get_queryset(request).annotate(
            total_bookings=Count('bookings'),
            approved_bookings=Count('bookings', filter=models.Q(bookings__approval_status='approved'))
        )
    
    def category_badge(self, obj):
        """Display category with colored badge"""
        colors = {
            'conference': '#3b82f6',
            'meeting': '#10b981', 
            'training': '#f59e0b',
            'boardroom': '#8b5cf6',
            'event_hall': '#ec4899',
            'auditorium': '#ef4444',
            'other': '#6b7280'
        }
        color = colors.get(obj.category, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">{}</span>',
            color, obj.get_category_display()
        )
    category_badge.short_description = 'Category'
    
    def capacity_display(self, obj):
        """Display capacity with visual indicator"""
        if obj.capacity <= 10:
            icon = '👥'
            color = '#10b981'
        elif obj.capacity <= 50:
            icon = '👥👥'
            color = '#3b82f6'
        else:
            icon = '👥👥👥'
            color = '#8b5cf6'
            
        return format_html(
            '<span style="color: {}; font-weight: bold;">{} {} people</span>',
            color, icon, obj.capacity
        )
    capacity_display.short_description = 'Capacity'
    
    def bookings_count(self, obj):
        """Display total and approved bookings count"""
        approved = getattr(obj, 'approved_bookings', 0)
        total = getattr(obj, 'total_bookings', 0)
        
        return format_html(
            '<div><strong>{}</strong> approved<br><small>{} total</small></div>',
            approved, total
        )
    bookings_count.short_description = 'Bookings'
    
    def amenities_display(self, obj):
        """Display first few amenities"""
        amenities = obj.get_amenities_list()
        if amenities:
            display_amenities = amenities[:3]
            extra_count = len(amenities) - 3
            
            text = ', '.join(display_amenities)
            if extra_count > 0:
                text += f' +{extra_count} more'
            
            return format_html('<small>{}</small>', text)
        return format_html('<small style="color: #9ca3af;">No amenities</small>')
    amenities_display.short_description = 'Amenities'
    
    actions = ['activate_rooms', 'deactivate_rooms', 'export_rooms']
    
    def activate_rooms(self, request, queryset):
        """Activate selected rooms"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} room(s) activated successfully.')
    activate_rooms.short_description = 'Activate selected rooms'
    
    def deactivate_rooms(self, request, queryset):
        """Deactivate selected rooms"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} room(s) deactivated.')
    deactivate_rooms.short_description = 'Deactivate selected rooms'
    
    def export_rooms(self, request, queryset):
        """Export rooms to CSV"""
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="rooms.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Name', 'Category', 'Capacity', 'Floor', 'Location', 'Active', 'Amenities'])
        
        for room in queryset:
            writer.writerow([
                room.name,
                room.get_category_display(),
                room.capacity,
                room.floor,
                room.location,
                'Yes' if room.is_active else 'No',
                ', '.join(room.get_amenities_list())
            ])
        
        return response
    export_rooms.short_description = 'Export to CSV'


@admin.register(RoomAmenity)
class RoomAmenityAdmin(admin.ModelAdmin):
    """
    Admin interface for Room Amenities
    """
    list_display = ('name_with_icon', 'description', 'is_active', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    ordering = ('name',)
    
    readonly_fields = ('created_at',)
    
    def name_with_icon(self, obj):
        """Display name with icon"""
        if obj.icon:
            return format_html('{} {}', obj.icon, obj.name)
        return obj.name
    name_with_icon.short_description = 'Amenity'
    
    actions = ['activate_amenities', 'deactivate_amenities']
    
    def activate_amenities(self, request, queryset):
        """Activate selected amenities"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} amenity(ies) activated.')
    activate_amenities.short_description = 'Activate selected amenities'
    
    def deactivate_amenities(self, request, queryset):
        """Deactivate selected amenities"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} amenity(ies) deactivated.')
    deactivate_amenities.short_description = 'Deactivate selected amenities'
