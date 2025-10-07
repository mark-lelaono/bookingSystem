#!/usr/bin/env python
import os
import django
from django.core.management import execute_from_command_line

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'icpac_booking.settings')
    django.setup()
    
    print("\n🚀 Starting ICPAC Booking System Backend...")
    print("📍 Django Server will run on: http://localhost:8000/")
    print("\n🌐 Available Browser Interfaces:")
    print("┌─────────────────────────────────────────────────────────┐")
    print("│ 🏠 API Info:        http://localhost:8000/             │")
    print("│ 🔐 Django Admin:    http://localhost:8000/admin/       │")
    print("│ 📝 Wagtail CMS:     http://localhost:8000/cms-admin/   │")
    print("│ 🏢 Rooms API:       http://localhost:8000/api/rooms/   │")
    print("│ 📅 Bookings API:    http://localhost:8000/api/bookings/│")
    print("│ 👥 Auth API:        http://localhost:8000/api/auth/    │")
    print("└─────────────────────────────────────────────────────────┘")
    print("\n🔑 Default Admin Login:")
    print("   Email: admin@icpac.net")
    print("   Password: (check with superuser creation)")
    print("\n⚡ Starting server... (Press Ctrl+C to stop)")
    print("─" * 60)
    
    execute_from_command_line(['manage.py', 'runserver', '0.0.0.0:8000'])