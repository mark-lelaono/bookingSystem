"""
Room URLs for ICPAC Booking System
"""
from django.urls import path
from . import views

app_name = 'rooms'

urlpatterns = [
    # Room management endpoints
    path('', views.RoomListView.as_view(), name='room_list'),
    path('<int:pk>/', views.RoomDetailView.as_view(), name='room_detail'),
    
    # Room amenities
    path('amenities/', views.RoomAmenityListView.as_view(), name='amenity_list'),
    
    # Room availability
    path('<int:room_id>/availability/', views.check_room_availability, name='check_availability'),
    
    # Room statistics
    path('<int:room_id>/stats/', views.room_booking_stats, name='room_stats'),
    path('stats/overview/', views.rooms_overview_stats, name='rooms_overview_stats'),
    
    # Room categories
    path('categories/', views.room_categories, name='room_categories'),
]