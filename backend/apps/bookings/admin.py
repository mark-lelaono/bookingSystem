from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Count, Q
from django.utils import timezone
from .models import Booking
from apps.rooms.models import Room

# Custom admin site configuration
admin.site.site_header = "ICPAC Booking System Admin"
admin.site.site_title = "ICPAC Booking Admin"
admin.site.index_title = "Welcome to ICPAC Booking Management"


# Removed RoomImageInline as RoomImage model doesn't exist yet


# Room admin is now registered in apps/rooms/admin.py
# @admin.register(Room)
class RoomAdminOld(admin.ModelAdmin):
    list_display = ('name', 'category_badge', 'capacity_display', 'floor', 'is_active', 'bookings_count')
    list_filter = ('category', 'is_active', 'floor', 'created_at')
    search_fields = ('name', 'description', 'amenities')
    readonly_fields = ('created_at', 'updated_at')

    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'category', 'description')
        }),
        ('Location & Capacity', {
            'fields': ('floor', 'capacity', 'amenities')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def category_badge(self, obj):
        colors = {
            'conference': '#3b82f6',
            'meeting': '#10b981',
            'training': '#f59e0b',
            'boardroom': '#8b5cf6',
            'other': '#6b7280'
        }
        color = colors.get(obj.category, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{}</span>',
            color, obj.get_category_display()
        )
    category_badge.short_description = 'Category'

    def capacity_display(self, obj):
        if obj.capacity <= 10:
            icon = '👥'
        elif obj.capacity <= 50:
            icon = '👥👥'
        else:
            icon = '👥👥👥'
        return f"{icon} {obj.capacity} people"
    capacity_display.short_description = 'Capacity'

    def bookings_count(self, obj):
        count = obj.bookings.filter(approval_status='approved').count()
        return format_html('<b>{}</b> bookings', count)
    bookings_count.short_description = 'Total Bookings'


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('purpose', 'room', 'user_display', 'date_time_display', 'status_badge', 'booking_type')
    list_filter = ('approval_status', 'booking_type', 'start_date', 'room__category', 'created_at')
    search_fields = ('purpose', 'user__username', 'user__email', 'room__name')
    readonly_fields = ('created_at', 'updated_at', 'approved_by', 'approved_at', 'booking_details')
    date_hierarchy = 'start_date'
    actions = ['approve_bookings', 'reject_bookings', 'export_to_csv']

    fieldsets = (
        ('Booking Information', {
            'fields': ('room', 'user', 'purpose', 'special_requirements')
        }),
        ('Schedule', {
            'fields': ('booking_type', 'start_date', 'end_date', 'start_time', 'end_time', 'expected_attendees', 'selected_dates')
        }),
        ('Approval', {
            'fields': ('approval_status', 'approved_by', 'approved_at', 'rejection_reason'),
            'classes': ('wide',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    def user_display(self, obj):
        return format_html(
            '<div><strong>{}</strong><br><small>{}</small></div>',
            obj.user.get_full_name() or obj.user.username,
            obj.user.email
        )
    user_display.short_description = 'User'

    def date_time_display(self, obj):
        if obj.booking_type == 'hourly':
            return format_html(
                '<div>{}<br><small>{} - {}</small></div>',
                obj.start_date.strftime('%Y-%m-%d'),
                obj.start_time.strftime('%H:%M'),
                obj.end_time.strftime('%H:%M')
            )
        elif obj.booking_type == 'multi_day' and obj.selected_dates and len(obj.selected_dates) > 0:
            # Show individual dates with commas and "and" for the last one
            date_strs = [str(d) if hasattr(d, 'year') else d for d in obj.selected_dates]
            if len(date_strs) == 1:
                dates_display = date_strs[0]
            elif len(date_strs) == 2:
                dates_display = f"{date_strs[0]} and {date_strs[1]}"
            else:
                # Use commas and "and" for last: "date1, date2, and date3"
                dates_display = ', '.join(date_strs[:-1]) + f", and {date_strs[-1]}"
            return format_html(
                '<div>{}<br><small>{}</small></div>',
                dates_display,
                obj.get_booking_type_display()
            )
        else:
            return format_html(
                '<div>{} to {}<br><small>{}</small></div>',
                obj.start_date.strftime('%Y-%m-%d'),
                obj.end_date.strftime('%Y-%m-%d'),
                obj.get_booking_type_display()
            )
    date_time_display.short_description = 'Schedule'

    def status_badge(self, obj):
        colors = {
            'pending': '#fbbf24',
            'approved': '#34d399',
            'rejected': '#f87171',
            'cancelled': '#9ca3af'
        }
        icons = {
            'pending': '⏳',
            'approved': '✅',
            'rejected': '❌',
            'cancelled': '🚫'
        }
        color = colors.get(obj.approval_status, '#9ca3af')
        icon = icons.get(obj.approval_status, '❓')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 10px; border-radius: 3px;">{} {}</span>',
            color, icon, obj.get_approval_status_display()
        )
    status_badge.short_description = 'Status'

    def booking_details(self, obj):
        conflicts = self.check_conflicts(obj)
        conflict_html = ''
        if conflicts:
            conflict_html = '<br><span style="color: red;">⚠️ Conflicts with {} other booking(s)</span>'.format(len(conflicts))

        return format_html(
            '<div style="background: #f3f4f6; padding: 10px; border-radius: 5px;">'
            '<strong>Room:</strong> {}<br>'
            '<strong>Purpose:</strong> {}<br>'
            '<strong>Attendees:</strong> {}<br>'
            '<strong>Created:</strong> {}{}'
            '</div>',
            obj.room.name,
            obj.purpose,
            obj.expected_attendees,
            obj.created_at.strftime('%Y-%m-%d %H:%M'),
            conflict_html
        )
    booking_details.short_description = 'Details'

    def check_conflicts(self, obj):
        return Booking.objects.filter(
            room=obj.room,
            approval_status='approved',
            start_date__lte=obj.end_date,
            end_date__gte=obj.start_date
        ).exclude(id=obj.id)

    def approve_bookings(self, request, queryset):
        updated = queryset.filter(approval_status='pending').update(
            approval_status='approved',
            approved_by=request.user,
            approved_at=timezone.now()
        )
        self.message_user(request, f'{updated} booking(s) approved successfully.')
    approve_bookings.short_description = 'Approve selected bookings'

    def reject_bookings(self, request, queryset):
        updated = queryset.filter(approval_status='pending').update(
            approval_status='rejected',
            approved_by=request.user,
            approved_at=timezone.now()
        )
        self.message_user(request, f'{updated} booking(s) rejected.')
    reject_bookings.short_description = 'Reject selected bookings'

    def export_to_csv(self, request, queryset):
        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="bookings.csv"'

        writer = csv.writer(response)
        writer.writerow(['Room', 'User', 'Purpose', 'Start Date', 'End Date', 'Status'])

        for booking in queryset:
            writer.writerow([
                booking.room.name,
                booking.user.email,
                booking.purpose,
                booking.start_date,
                booking.end_date,
                booking.approval_status
            ])

        return response
    export_to_csv.short_description = 'Export to CSV'


# Dashboard customization
class BookingDashboard(admin.AdminSite):
    def index(self, request, extra_context=None):
        extra_context = extra_context or {}

        # Add dashboard statistics
        extra_context['total_rooms'] = Room.objects.filter(is_active=True).count()
        extra_context['pending_bookings'] = Booking.objects.filter(approval_status='pending').count()
        extra_context['todays_bookings'] = Booking.objects.filter(
            start_date=timezone.now().date(),
            approval_status='approved'
        ).count()

        return super().index(request, extra_context)