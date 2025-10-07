from django.core.management.base import BaseCommand
from apps.rooms.models import Room, RoomAmenity


class Command(BaseCommand):
    help = 'Initialize rooms and amenities with sample data'

    def handle(self, *args, **options):
        self.stdout.write('Creating amenities...')

        amenities_data = [
            {'name': 'Projector', 'icon': '📽️', 'description': 'Digital projector for presentations'},
            {'name': 'Whiteboard', 'icon': '📝', 'description': 'Whiteboard with markers'},
            {'name': 'Video Conferencing', 'icon': '📹', 'description': 'Video conference setup'},
            {'name': 'Audio System', 'icon': '🎤', 'description': 'Sound system with microphones'},
            {'name': 'TV Screen', 'icon': '📺', 'description': 'Large TV screen'},
            {'name': 'Screen', 'icon': '🖥️', 'description': 'Projection screen'},
            {'name': 'Computers', 'icon': '💻', 'description': 'Computer workstations'},
        ]

        for amenity_data in amenities_data:
            amenity, created = RoomAmenity.objects.get_or_create(
                name=amenity_data['name'],
                defaults=amenity_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Created amenity: {amenity.name}'))
            else:
                self.stdout.write(f'  Amenity already exists: {amenity.name}')

        self.stdout.write('\nCreating rooms...')

        rooms_data = [
            {
                'name': 'Conference Room - Ground Floor',
                'capacity': 200,
                'category': 'conference',
                'floor': '0',
                'is_active': True,
                'description': 'Large conference room on the ground floor'
            },
            {
                'name': 'Boardroom - First Floor',
                'capacity': 25,
                'category': 'conference',
                'floor': '1',
                'is_active': True,
                'description': 'Executive boardroom on the first floor'
            },
            {
                'name': 'Computer Lab 1 - Ground Floor',
                'capacity': 20,
                'category': 'training',
                'floor': '0',
                'is_active': True,
                'description': 'Computer training lab with workstations'
            },
        ]

        for room_data in rooms_data:
            room, created = Room.objects.get_or_create(
                name=room_data['name'],
                defaults=room_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✓ Created room: {room.name}'))
            else:
                self.stdout.write(f'  Room already exists: {room.name}')

        self.stdout.write(self.style.SUCCESS('\n✅ Initialization complete!'))
