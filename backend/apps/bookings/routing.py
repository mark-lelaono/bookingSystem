"""
WebSocket routing for booking app
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/bookings/$', consumers.BookingConsumer.as_asgi()),
    re_path(r'ws/rooms/(?P<room_id>\w+)/$', consumers.RoomConsumer.as_asgi()),
]