"""
WebSocket consumers for real-time booking updates
"""
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import UntypedToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings
import jwt

User = get_user_model()


class BookingConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time booking updates
    """
    
    async def connect(self):
        """Handle WebSocket connection with authentication check"""
        # Get token from query string
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        
        if query_string:
            try:
                # Parse query string to get token
                from urllib.parse import parse_qs
                query_params = parse_qs(query_string)
                token = query_params.get('token', [None])[0]
            except:
                pass
        
        # Authenticate user with token
        if token:
            user = await self.authenticate_token(token)
            if user:
                self.user = user
                self.room_group_name = 'booking_updates'
                
                # Only authenticated users can join groups
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                
                await self.accept()
                
                # Send authentication success message
                await self.send(text_data=json.dumps({
                    'type': 'auth_success',
                    'message': 'Authenticated and connected'
                }))
                return
        
        # Reject unauthenticated connections
        await self.close(code=4001, reason='Authentication required')
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket (only from authenticated users)"""
        # Check if user is authenticated
        if not hasattr(self, 'user') or not self.user:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Authentication required'
            }))
            await self.close(code=4001)
            return
            
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'ping':
                # Handle ping for connection keep-alive
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': text_data_json.get('timestamp')
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
    
    async def booking_update(self, event):
        """Send booking update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'booking_update',
            'data': event['data']
        }))
    
    async def room_availability_update(self, event):
        """Send room availability update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'room_availability_update',
            'data': event['data']
        }))
    
    async def booking_status_change(self, event):
        """Send booking status change to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'booking_status_change',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def authenticate_token(self, token):
        """Authenticate JWT token"""
        try:
            # Decode the token
            UntypedToken(token)
            
            # Get user from token
            decoded_data = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=["HS256"]
            )
            user_id = decoded_data.get('user_id')
            
            if user_id:
                user = User.objects.get(id=user_id)
                return user
                
        except (InvalidToken, TokenError, User.DoesNotExist, jwt.InvalidTokenError):
            pass
        
        return None


class RoomConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for real-time room updates
    """
    
    async def connect(self):
        """Handle WebSocket connection with authentication check"""
        # Get token from query string
        query_string = self.scope.get('query_string', b'').decode()
        token = None
        
        if query_string:
            try:
                from urllib.parse import parse_qs
                query_params = parse_qs(query_string)
                token = query_params.get('token', [None])[0]
            except:
                pass
        
        # Authenticate user with token
        if token:
            user = await self.authenticate_token(token)
            if user:
                self.user = user
                self.room_id = self.scope['url_route']['kwargs']['room_id']
                self.room_group_name = f'room_{self.room_id}'
                
                # Only authenticated users can join room groups
                await self.channel_layer.group_add(
                    self.room_group_name,
                    self.channel_name
                )
                
                await self.accept()
                return
        
        # Reject unauthenticated connections
        await self.close(code=4001, reason='Authentication required')
    
    async def disconnect(self, close_code):
        """Handle WebSocket disconnection"""
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )
    
    async def receive(self, text_data):
        """Receive message from WebSocket"""
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            if message_type == 'request_availability':
                # Send current room availability
                availability_data = await self.get_room_availability()
                await self.send(text_data=json.dumps({
                    'type': 'room_availability',
                    'data': availability_data
                }))
                
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'Invalid JSON format'
            }))
    
    async def room_booking_update(self, event):
        """Send room booking update to WebSocket"""
        await self.send(text_data=json.dumps({
            'type': 'room_booking_update',
            'data': event['data']
        }))
    
    @database_sync_to_async
    def get_room_availability(self):
        """Get current room availability"""
        from .models import Booking
        from datetime import datetime, timedelta
        from django.utils import timezone
        
        # Get today's bookings for this room
        today = timezone.now().date()
        bookings = Booking.objects.filter(
            room_id=self.room_id,
            start_date__lte=today,
            end_date__gte=today,
            approval_status='approved'
        ).values('start_time', 'end_time', 'purpose', 'user__first_name', 'user__last_name')
        
        return {
            'room_id': self.room_id,
            'date': today.isoformat(),
            'bookings': list(bookings)
        }
    
    @database_sync_to_async
    def authenticate_token(self, token):
        """Authenticate JWT token"""
        try:
            # Decode the token
            UntypedToken(token)
            
            # Get user from token
            decoded_data = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=["HS256"]
            )
            user_id = decoded_data.get('user_id')
            
            if user_id:
                user = User.objects.get(id=user_id)
                return user
                
        except (InvalidToken, TokenError, User.DoesNotExist, jwt.InvalidTokenError):
            pass
        
        return None