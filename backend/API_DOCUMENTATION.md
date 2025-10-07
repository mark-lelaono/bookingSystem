# ICPAC Booking System - API Documentation

## Overview

The ICPAC Booking System backend is a Django REST API that provides comprehensive room booking and management functionality. The system supports role-based permissions, real-time availability checking, and procurement order management.

## Base URL
```
http://localhost:8001/api/
```

## Authentication

The API uses JWT (JSON Web Token) authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## User Roles

- **super_admin**: Full system access
- **room_admin**: Manage specific rooms and their bookings
- **procurement_officer**: Handle procurement orders
- **user**: Regular user (create bookings, view own data)

## API Endpoints

### Authentication Endpoints

#### Login
```
POST /api/auth/login/
Content-Type: application/json

{
    "email": "admin@icpac.net",
    "password": "admin123"
}

Response:
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "username": "superadmin",
        "email": "admin@icpac.net",
        "full_name": "Super Admin",
        "role": "super_admin"
    }
}
```

#### Register New User
```
POST /api/auth/register/
Content-Type: application/json

{
    "email": "newuser@icpac.net",
    "username": "newuser",
    "first_name": "John",
    "last_name": "Doe",
    "password": "securepassword123",
    "password_confirm": "securepassword123",
    "phone_number": "+254712345678",
    "department": "IT"
}
```

#### Refresh Token
```
POST /api/auth/token/refresh/
Content-Type: application/json

{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### Get Current User Profile
```
GET /api/auth/profile/
Authorization: Bearer <access_token>

Response:
{
    "id": 1,
    "username": "superadmin",
    "email": "admin@icpac.net",
    "first_name": "Super",
    "last_name": "Admin",
    "full_name": "Super Admin",
    "role": "super_admin",
    "phone_number": "",
    "department": "",
    "is_active": true,
    "date_joined": "2024-01-01T10:00:00Z"
}
```

### Room Endpoints

#### Get All Rooms
```
GET /api/rooms/
Authorization: Bearer <access_token>

Query Parameters:
- category: Filter by room category
- min_capacity: Minimum room capacity
- amenities: Filter by amenities (can be multiple)
- search: Search in name, location, description

Response:
[
    {
        "id": 1,
        "name": "Conference Room A - Main Building",
        "capacity": 20,
        "category": "conference_room",
        "category_display": "Conference Room",
        "location": "Main Building, 2nd Floor",
        "amenities": ["Projector", "Whiteboard", "Video Conferencing"],
        "image": null,
        "is_active": true
    }
]
```

#### Get Room Details
```
GET /api/rooms/1/
Authorization: Bearer <access_token>

Response:
{
    "id": 1,
    "name": "Conference Room A - Main Building",
    "capacity": 20,
    "category": "conference_room",
    "category_display": "Conference Room",
    "location": "Main Building, 2nd Floor",
    "description": "Large conference room with modern facilities",
    "amenities": ["Projector", "Whiteboard", "Video Conferencing"],
    "amenities_list": "Projector, Whiteboard, Video Conferencing",
    "is_large_room": false,
    "advance_booking_days": 30,
    "min_booking_duration": 1,
    "max_booking_duration": 8,
    "total_bookings": 15,
    "upcoming_bookings": [
        {
            "id": 1,
            "purpose": "Weekly Team Meeting",
            "user_name": "John Doe",
            "start_date": "2024-01-15",
            "start_time": "09:00:00",
            "end_time": "10:00:00",
            "expected_attendees": 8
        }
    ]
}
```

#### Check Room Availability
```
POST /api/rooms/1/availability/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "date": "2024-01-15",
    "start_time": "09:00:00",  // optional
    "end_time": "17:00:00"     // optional
}

Response:
{
    "room_id": 1,
    "room_name": "Conference Room A - Main Building",
    "date": "2024-01-15",
    "availability": {
        "is_available": true,
        "available_slots": [
            {"start": "08:00", "end": "09:00"},
            {"start": "10:00", "end": "17:00"}
        ],
        "booked_slots": [
            {"start": "09:00", "end": "10:00", "purpose": "Weekly Team Meeting"}
        ]
    }
}
```

#### Get Room Categories
```
GET /api/rooms/categories/
Authorization: Bearer <access_token>

Response:
{
    "categories": [
        {
            "category": "conference_room",
            "category_display": "Conference Room",
            "count": 2,
            "average_capacity": 17.5
        }
    ],
    "total_categories": 1
}
```

### Booking Endpoints

#### Get All Bookings
```
GET /api/bookings/
Authorization: Bearer <access_token>

Query Parameters:
- status: Filter by approval status (pending, approved, rejected, cancelled)
- room: Filter by room ID
- date_from: Filter bookings from date (YYYY-MM-DD)
- date_to: Filter bookings to date (YYYY-MM-DD)

Response:
[
    {
        "id": 1,
        "room_name": "Conference Room A - Main Building",
        "user_name": "John Doe",
        "start_date": "2024-01-15",
        "end_date": "2024-01-15",
        "start_time": "09:00:00",
        "end_time": "10:00:00",
        "purpose": "Weekly Team Meeting",
        "expected_attendees": 8,
        "approval_status": "approved",
        "approval_status_display": "Approved"
    }
]
```

#### Create New Booking
```
POST /api/bookings/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "room": 1,
    "start_date": "2024-01-20",
    "end_date": "2024-01-20",
    "start_time": "14:00:00",
    "end_time": "16:00:00",
    "purpose": "Project Planning Meeting",
    "expected_attendees": 6,
    "special_requirements": "Need projector and whiteboard"
}

Response:
{
    "message": "Booking created successfully",
    "booking_id": 2
}
```

#### Get Booking Details
```
GET /api/bookings/1/
Authorization: Bearer <access_token>

Response:
{
    "id": 1,
    "room": 1,
    "room_name": "Conference Room A - Main Building",
    "user": 1,
    "user_name": "John Doe",
    "start_date": "2024-01-15",
    "end_date": "2024-01-15",
    "start_time": "09:00:00",
    "end_time": "10:00:00",
    "purpose": "Weekly Team Meeting",
    "expected_attendees": 8,
    "special_requirements": "",
    "approval_status": "approved",
    "approval_status_display": "Approved",
    "approved_by": 1,
    "approved_at": "2024-01-10T15:30:00Z",
    "rejection_reason": "",
    "duration_hours": 1.0,
    "can_modify": false,
    "created_at": "2024-01-10T10:00:00Z",
    "updated_at": "2024-01-10T15:30:00Z"
}
```

#### Approve/Reject Booking (Admin Only)
```
POST /api/bookings/1/approve-reject/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "action": "approve",          // or "reject"
    "rejection_reason": ""        // required for reject
}

Response:
{
    "message": "Booking approved successfully.",
    "booking": { ... }
}
```

#### Get My Bookings
```
GET /api/bookings/my-bookings/
Authorization: Bearer <access_token>

Response:
{
    "upcoming_bookings": [...],
    "recent_bookings": [...],
    "statistics": {
        "total_bookings": 5,
        "approved_bookings": 4,
        "pending_bookings": 1
    }
}
```

#### Get Pending Approvals (Admin Only)
```
GET /api/bookings/pending-approvals/
Authorization: Bearer <access_token>

Response:
{
    "pending_bookings": [...],
    "count": 3
}
```

#### Get Calendar Events
```
GET /api/bookings/calendar/events/
Authorization: Bearer <access_token>

Query Parameters:
- start: Start date (YYYY-MM-DD)
- end: End date (YYYY-MM-DD)

Response:
{
    "events": [
        {
            "id": 1,
            "title": "Conference Room A - Weekly Team Meeting",
            "start": "2024-01-15T09:00:00",
            "end": "2024-01-15T10:00:00",
            "backgroundColor": "#28a745",
            "extendedProps": {
                "room": "Conference Room A - Main Building",
                "user": "John Doe",
                "status": "approved",
                "attendees": 8
            }
        }
    ],
    "total_events": 1
}
```

### Dashboard & Statistics

#### User Dashboard Stats
```
GET /api/auth/dashboard/stats/
Authorization: Bearer <access_token>

Response:
{
    "total_bookings": 5,
    "pending_bookings": 1,
    "approved_bookings": 4,
    "user_role": "user"
}
```

#### Booking Dashboard Stats
```
GET /api/bookings/dashboard/stats/
Authorization: Bearer <access_token>

Response:
{
    "statistics": {
        "total_bookings": 25,
        "recent_bookings_count": 8,
        "approved_bookings": 20,
        "pending_bookings": 3,
        "rejected_bookings": 2,
        "most_popular_room": "Conference Room A - Main Building"
    },
    "recent_bookings": [...],
    "date_range": {
        "start_date": "2023-12-22",
        "end_date": "2024-01-21"
    }
}
```

#### Room Overview Stats (Admin Only)
```
GET /api/rooms/stats/overview/
Authorization: Bearer <access_token>

Response:
{
    "total_rooms": 5,
    "total_bookings_last_30_days": 25,
    "approved_bookings_last_30_days": 20,
    "pending_bookings_last_30_days": 3,
    "room_statistics": [
        {
            "id": 1,
            "name": "Conference Room A - Main Building",
            "category": "conference_room",
            "capacity": 20,
            "total_bookings": 8,
            "utilization_rate": 15.5
        }
    ]
}
```

### Procurement Orders

#### Get Procurement Orders
```
GET /api/bookings/procurement-orders/
Authorization: Bearer <access_token>

Response:
[
    {
        "id": 1,
        "booking": 1,
        "booking_details": {
            "purpose": "Weekly Team Meeting",
            "room_name": "Conference Room A",
            "start_date": "2024-01-15"
        },
        "order_type": "catering",
        "items_description": "Coffee, tea, and light snacks for 8 people",
        "estimated_cost": "150.00",
        "priority": "medium",
        "status": "pending",
        "status_display": "Pending",
        "created_by_name": "John Doe"
    }
]
```

#### Create Procurement Order
```
POST /api/bookings/procurement-orders/
Authorization: Bearer <access_token>
Content-Type: application/json

{
    "booking": 1,
    "order_type": "catering",
    "items_description": "Coffee, tea, and light snacks for 8 people",
    "estimated_cost": 150.00,
    "priority": "medium",
    "notes": "Please deliver 30 minutes before meeting starts"
}
```

## Error Handling

The API returns standard HTTP status codes and error responses:

```json
{
    "error": "Invalid credentials",
    "detail": "Unable to log in with provided credentials."
}
```

Common status codes:
- 200: Success
- 201: Created
- 400: Bad Request (validation errors)
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

## Sample Login Credentials

For testing purposes, the following users are created:

1. **Super Admin**
   - Email: admin@icpac.net
   - Password: admin123

2. **Procurement Officer**
   - Email: procurement@icpac.net
   - Password: procurement123

3. **Regular User**
   - Email: user@icpac.net
   - Password: user123

## Development Setup

1. Start the Django server:
   ```bash
   python manage.py runserver 8001
   ```

2. The API will be available at: http://localhost:8001/api/

3. Admin panel: http://localhost:8001/admin/

## Next Steps

1. **Frontend Integration**: Connect React frontend with these API endpoints
2. **WebSocket Implementation**: Add real-time notifications
3. **Email Notifications**: Implement Celery tasks for email notifications
4. **File Uploads**: Add support for room images and attachments
5. **Advanced Reporting**: Add more detailed analytics and reports
6. **Mobile API**: Optimize endpoints for mobile applications

## Technology Stack

- **Backend**: Django 5.0 + Django REST Framework
- **Database**: SQLite (development) / PostgreSQL (production)
- **Authentication**: JWT tokens
- **Documentation**: Auto-generated with DRF
- **Deployment**: Docker-ready configuration

The backend is now fully functional and ready for frontend integration!