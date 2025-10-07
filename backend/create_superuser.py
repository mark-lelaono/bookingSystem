#!/usr/bin/env python
"""
Script to create initial superuser and sample data for ICPAC Booking System
"""
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'icpac_booking.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.rooms.models import Room, RoomAmenity
from apps.bookings.models import Booking

User = get_user_model()

def create_users():
    """Create initial users"""
    
    # Super Admin
    if not User.objects.filter(email='admin@icpac.net').exists():
        super_admin = User.objects.create_user(
            username='superadmin',
            email='admin@icpac.net',
            password='admin123',
            first_name='Super',
            last_name='Admin',
            role='super_admin',
            is_staff=True,
            is_superuser=True
        )
        print(f"✅ Created super admin: {super_admin.email}")
    
    # Procurement Officer
    if not User.objects.filter(email='procurement@icpac.net').exists():
        procurement = User.objects.create_user(
            username='procurement',
            email='procurement@icpac.net',
            password='procurement123',
            first_name='Procurement',
            last_name='Officer',
            role='procurement_officer'
        )
        print(f"✅ Created procurement officer: {procurement.email}")
    
    # Sample regular user
    if not User.objects.filter(email='user@icpac.net').exists():
        user = User.objects.create_user(
            username='sampleuser',
            email='user@icpac.net',
            password='user123',
            first_name='John',
            last_name='Doe',
            role='user',
            department='Research'
        )
        print(f"✅ Created sample user: {user.email}")

def create_amenities():
    """Create room amenities"""
    
    amenities = [
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
    ]
    
    for amenity_data in amenities:
        amenity, created = RoomAmenity.objects.get_or_create(
            name=amenity_data['name'],
            defaults={
                'icon': amenity_data['icon'],
                'description': amenity_data['description']
            }
        )
        if created:
            print(f"✅ Created amenity: {amenity.name}")

def create_rooms():
    """Create sample rooms"""
    
    rooms_data = [
        {
            'name': 'Conference Room A - Main Building',
            'capacity': 20,
            'category': 'conference_room',
            'location': 'Main Building, 2nd Floor',
            'description': 'Large conference room with modern facilities',
            'amenities': ['Projector', 'Whiteboard', 'Video Conferencing', 'Audio System', 'Air Conditioning']
        },
        {
            'name': 'Meeting Room B - Annex',
            'capacity': 10,
            'category': 'meeting_room',
            'location': 'Annex Building, Ground Floor',
            'description': 'Cozy meeting room for small groups',
            'amenities': ['TV Screen', 'Whiteboard', 'Internet Access', 'Air Conditioning']
        },
        {
            'name': 'Boardroom - Executive Wing',
            'capacity': 15,
            'category': 'boardroom',
            'location': 'Executive Wing, 3rd Floor',
            'description': 'Executive boardroom for senior meetings',
            'amenities': ['Projector', 'Video Conferencing', 'Audio System', 'Air Conditioning']
        },
        {
            'name': 'Training Room C - Training Center',
            'capacity': 30,
            'category': 'training_room',
            'location': 'Training Center, 1st Floor',
            'description': 'Training room with computer stations',
            'amenities': ['Projector', 'Screen', 'Computers', 'Internet Access', 'Whiteboard', 'Air Conditioning']
        },
        {
            'name': 'Event Hall - Main Building',
            'capacity': 100,
            'category': 'event_hall',
            'location': 'Main Building, Ground Floor',
            'description': 'Large event hall for conferences and seminars',
            'amenities': ['Projector', 'Audio System', 'Video Conferencing', 'Air Conditioning']
        }
    ]
    
    for room_data in rooms_data:
        if not Room.objects.filter(name=room_data['name']).exists():
            room = Room.objects.create(
                name=room_data['name'],
                capacity=room_data['capacity'],
                category=room_data['category'],
                location=room_data['location'],
                description=room_data['description'],
                amenities=room_data['amenities']
            )
            print(f"✅ Created room: {room.name}")

def main():
    """Run all setup functions"""
    print("🚀 Setting up ICPAC Booking System...")
    print("-" * 50)
    
    create_users()
    print()
    
    create_amenities() 
    print()
    
    create_rooms()
    print()
    
    print("✅ Setup completed successfully!")
    print("-" * 50)
    print("🔐 Login credentials:")
    print("   Super Admin: admin@icpac.net / admin123")
    print("   Procurement: procurement@icpac.net / procurement123")
    print("   Sample User: user@icpac.net / user123")
    print()
    print("🌐 Start the server with: python manage.py runserver 8000")

if __name__ == '__main__':
    main()