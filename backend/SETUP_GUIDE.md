# 🚀 ICPAC Booking System - Backend Setup Guide

## Overview
Complete guide to set up the ICPAC Booking System backend locally on your machine.

---

## Prerequisites

### Required Software:
- **Python 3.9+** - [Download](https://www.python.org/downloads/)
- **PostgreSQL 15+** - [Download](https://www.postgresql.org/download/)
- **Git** (optional) - For version control

---

## 📋 Setup Steps

### **Step 1: Install PostgreSQL**

1. Download PostgreSQL from: https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Remember the **postgres** password you set
   - Default port: **5432** (keep this)
   - Install Stack Builder components (optional)

### **Step 2: Create Database and User**

Open **Command Prompt** or **PowerShell** and run:

```bash
# Login to PostgreSQL (enter postgres password when prompted)
psql -U postgres
```

Then execute these SQL commands:

```sql
-- Create database user
CREATE USER icpac_user WITH PASSWORD 'icpac_password123';

-- Create database
CREATE DATABASE icpac_booking_db OWNER icpac_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE icpac_booking_db TO icpac_user;

-- Allow user to create test databases
ALTER USER icpac_user CREATEDB;

-- Exit PostgreSQL
\q
```

**Database Credentials Created:**
- Database: `icpac_booking_db`
- Username: `icpac_user`
- Password: `icpac_password123`
- Host: `localhost`
- Port: `5432`

---

### **Step 3: Configure Environment**

Create a `.env` file in the `backend` folder with:

```env
# PostgreSQL Database Configuration
PGDATABASE=icpac_booking_db
PGUSER=icpac_user
PGPASSWORD=icpac_password123
PGHOST=localhost
PGPORT=5432

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000

# Django Settings
DEBUG=True
SECRET_KEY=django-insecure-change-me-in-production-abc123xyz

# Email (Development - prints to console)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@icpac.net
```

---

### **Step 4: Install Python Dependencies**

Open **PowerShell** or **Command Prompt** in the `backend` folder:

```bash
# Navigate to backend folder
cd backend

# Install all required packages
pip install -r requirements.txt
```

This installs:
- Django 5.0.7
- Django REST Framework
- PostgreSQL adapter (psycopg2)
- JWT authentication
- CORS headers
- Channels (WebSocket support)
- Wagtail CMS
- And 60+ other dependencies

**Time:** ~2-3 minutes depending on internet speed

---

### **Step 5: Run Database Migrations**

```bash
python manage.py migrate
```

**What this does:**
- Creates all database tables (users, rooms, bookings, etc.)
- Sets up authentication system
- Configures Wagtail CMS
- Initializes security features

**Expected Output:**
```
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  Applying authentication.0001_initial... OK
  Applying rooms.0001_initial... OK
  Applying bookings.0001_initial... OK
  ...
```

---

### **Step 6: Create Superuser and Sample Data**

```bash
python create_superuser.py
```

**What this creates:**
- ✅ Super admin account
- ✅ Procurement officer account
- ✅ Sample user account
- ✅ Room amenities (Projector, Whiteboard, etc.)
- ✅ Sample meeting rooms

**Accounts Created:**

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@icpac.net | admin123 |
| Procurement Officer | procurement@icpac.net | procurement123 |
| Regular User | user@icpac.net | user123 |

---

### **Step 7: Start the Backend Server**

```bash
python start_server.py
```

OR

```bash
python manage.py runserver 8000
```

**Expected Output:**
```
🚀 Starting ICPAC Booking System Backend...
📍 Django Server will run on: http://localhost:8000/

🌐 Available Browser Interfaces:
┌─────────────────────────────────────────────────────────┐
│ 🏠 API Info:        http://localhost:8000/             │
│ 🔐 Django Admin:    http://localhost:8000/django-admin/│
│ 📝 Wagtail CMS:     http://localhost:8000/cms/         │
│ 🏢 Rooms API:       http://localhost:8000/api/rooms/   │
│ 📅 Bookings API:    http://localhost:8000/api/bookings/│
│ 👥 Auth API:        http://localhost:8000/api/auth/    │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Verify Installation

### **1. Test API Root**
Open browser: **http://localhost:8000/api/**

Should display:
```json
{
  "message": "ICPAC Booking API",
  "version": "1.0",
  "endpoints": {
    "auth": "/api/auth/",
    "rooms": "/api/rooms/",
    "bookings": "/api/bookings/",
    "admin": "/admin/"
  }
}
```

### **2. Test Django Admin**
Open browser: **http://localhost:8000/django-admin/**

Login with:
- Email: `admin@icpac.net`
- Password: `admin123`

### **3. Test API Endpoints**

**Get Rooms:**
```bash
curl http://localhost:8000/api/rooms/
```

**Login:**
```bash
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@icpac.net","password":"admin123"}'
```

---

## 🔧 Common Issues & Solutions

### **Issue 1: PostgreSQL Connection Failed**

**Error:** `could not connect to server`

**Solution:**
```bash
# Check if PostgreSQL is running
# Windows: Open Services and start PostgreSQL
# OR restart PostgreSQL service
```

### **Issue 2: Database Already Exists**

**Error:** `database "icpac_booking_db" already exists`

**Solution:** Already created - skip to Step 4

### **Issue 3: Migration Errors**

**Error:** `relation already exists`

**Solution:**
```bash
# Reset migrations (development only!)
python manage.py migrate --fake
```

### **Issue 4: Port 8000 Already in Use**

**Solution:**
```bash
# Use different port
python manage.py runserver 8001
# Update frontend API_BASE_URL to match
```

### **Issue 5: Module Not Found**

**Error:** `ModuleNotFoundError: No module named 'X'`

**Solution:**
```bash
# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

---

## 📁 Project Structure

```
backend/
├── apps/                      # Django applications
│   ├── authentication/        # User auth & JWT
│   ├── bookings/             # Booking management
│   ├── rooms/                # Room management
│   ├── security/             # Security features
│   └── cms_content/          # Wagtail CMS
├── icpac_booking/            # Main Django project
│   ├── settings.py           # Configuration
│   ├── urls.py               # URL routing
│   └── asgi.py               # ASGI config (WebSocket)
├── manage.py                 # Django management
├── create_superuser.py       # Initial data script
├── start_server.py           # Server launcher
├── requirements.txt          # Python dependencies
├── .env                      # Environment variables (create this)
└── db.sqlite3               # Database file (after migration)
```

---

## 🌐 API Endpoints

### **Authentication**
- `POST /api/auth/login/` - User login
- `POST /api/auth/register/` - User registration
- `POST /api/auth/verify-email/` - Email verification
- `GET /api/auth/profile/` - User profile
- `POST /api/auth/logout/` - Logout

### **Rooms**
- `GET /api/rooms/` - List all rooms
- `GET /api/rooms/{id}/` - Room details
- `POST /api/rooms/{id}/availability/` - Check availability
- `GET /api/rooms/categories/` - Room categories

### **Bookings**
- `GET /api/bookings/` - List all bookings
- `POST /api/bookings/` - Create booking
- `GET /api/bookings/my-bookings/` - My bookings
- `POST /api/bookings/{id}/approve-reject/` - Approve/reject (admin)
- `GET /api/bookings/dashboard/stats/` - Statistics

---

## 🎯 Quick Start Commands

```bash
# Full setup from scratch
cd backend
pip install -r requirements.txt
python manage.py migrate
python create_superuser.py
python start_server.py
```

**That's it! Backend running on http://localhost:8000/**

---

## 🔐 Default Credentials

| Account Type | Email | Password |
|-------------|-------|----------|
| **Super Admin** | admin@icpac.net | admin123 |
| Procurement | procurement@icpac.net | procurement123 |
| Regular User | user@icpac.net | user123 |

---

## 📊 Database Schema

### **Main Tables:**
- `authentication_user` - Users and authentication
- `rooms` - Meeting rooms
- `bookings` - Room bookings
- `room_amenities` - Available amenities
- `email_verification_otp` - Email verification codes

---

## 🧪 Testing

### **Test with Admin Panel:**
1. Go to http://localhost:8000/django-admin/
2. Login with `admin@icpac.net` / `admin123`
3. Navigate to Rooms → Add some rooms
4. Navigate to Bookings → View/manage bookings

### **Test with API:**
Use tools like:
- **Postman** - GUI for API testing
- **curl** - Command line
- **Thunder Client** (VS Code extension)
- **Frontend** - Connect React app

---

## 🔄 Daily Development Workflow

```bash
# Start backend
cd backend
python start_server.py

# In another terminal, start frontend
cd frontend
npm start
```

**Backend:** http://localhost:8000/
**Frontend:** http://localhost:3000/

---

## 📝 Notes

- **Development Mode:** DEBUG=True, emails print to console
- **Database:** PostgreSQL for production-ready setup
- **CORS:** Configured to allow localhost:3000
- **Authentication:** JWT tokens (1 hour access, 7 days refresh)
- **Time Zone:** Africa/Nairobi (EAT)

---

## 🚀 Production Deployment

For production, you'll need to:
1. Set `DEBUG=False` in settings
2. Configure proper `SECRET_KEY`
3. Set up real SMTP email server
4. Configure allowed hosts
5. Set up static file serving (WhiteNoise included)
6. Use environment variables for sensitive data
7. Set up SSL/HTTPS

---

## 📞 Support

For issues or questions:
- Check Django logs in terminal
- Review `API_DOCUMENTATION.md` for endpoint details
- Check `POSTGRESQL_SETUP.md` for database help
- Review `SMTP_SETUP.md` for email configuration

---

## ✅ Success Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `icpac_booking_db` created
- [ ] Python dependencies installed
- [ ] Migrations completed successfully
- [ ] Superuser created
- [ ] Server starts without errors
- [ ] Can access http://localhost:8000/api/
- [ ] Can login to Django admin
- [ ] Can login with admin@icpac.net

**If all checked, you're ready to develop!** 🎉

---

**Version:** 1.0  
**Last Updated:** October 2025  
**Django Version:** 5.0.7  
**Python Version:** 3.9+
