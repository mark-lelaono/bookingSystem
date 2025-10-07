# 🚀 ICPAC Booking System - Frontend Setup Guide

## Overview
Complete guide to set up the ICPAC Booking System React frontend locally.

---

## Prerequisites

### Required Software:
- **Node.js 16+** - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Backend Running** - See backend/SETUP_GUIDE.md

---

## 📋 Setup Steps

### **Step 1: Install Dependencies**

Open **PowerShell** or **Command Prompt** in the `frontend` folder:

```bash
# Navigate to frontend folder
cd frontend

# Install all npm packages
npm install
```

**What this installs:**
- React 18
- Material-UI (MUI)
- React Router
- TypeScript
- And 200+ dependencies

**Time:** ~2-3 minutes depending on internet speed

---

### **Step 2: Configure Backend Connection**

The frontend is already configured to connect to:
- **Backend API:** http://localhost:8000/api/

If your backend runs on a different port, create a `.env` file:

```env
REACT_APP_API_URL=http://localhost:8000/api
```

---

### **Step 3: Start Development Server**

```bash
npm start
```

**Expected Output:**
```
Compiled successfully!

You can now view icpac-booking-frontend in the browser.

  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

The app will automatically open in your browser at: **http://localhost:3000/**

---

## ✅ Verify Installation

### **1. Check App Loads**
- Browser should open automatically
- Should see login page with ICPAC logo
- Background images should rotate

### **2. Test Login**
Login with backend credentials:
- Email: `admin@icpac.net`
- Password: `admin123`

Should redirect to booking board.

### **3. Test Features**
- ✅ View rooms in availability section
- ✅ Filter rooms by category/status
- ✅ Click on room to see schedule
- ✅ Create a new booking
- ✅ View "My Bookings"

---

## 🔧 Common Issues & Solutions

### **Issue 1: Port 3000 Already in Use**

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Kill the process using port 3000
# OR specify different port
set PORT=3001 && npm start
```

### **Issue 2: Module Not Found**

**Error:** `Cannot find module 'X'`

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules
npm install
```

### **Issue 3: Backend Connection Failed**

**Error:** `Failed to fetch` in browser console

**Solutions:**
1. Check backend is running on http://localhost:8000/
2. Clear browser cache
3. Restart frontend: `Ctrl+C` then `npm start`

### **Issue 4: CORS Errors**

**Error:** `CORS policy: No 'Access-Control-Allow-Origin'`

**Solution:**
Backend CORS is already configured. Make sure:
- Backend is running
- Backend `.env` has `FRONTEND_URL=http://localhost:3000`
- Restart backend after changing CORS settings

---

## 📁 Project Structure

```
frontend/
├── public/                    # Static files
│   ├── index.html            # HTML template
│   ├── ICPAC_Website_Header_Logo.svg
│   └── icpac-meeting-spaces/ # Room images
├── src/
│   ├── components/           # React components
│   │   ├── booking/          # Booking-related components
│   │   └── common/           # Shared components (Header, Footer)
│   ├── context/              # React Context (state management)
│   │   └── AppContext.tsx    # Global app state
│   ├── pages/                # Page components
│   │   ├── LoginPage.tsx     # Login/signup page
│   │   ├── BookingBoard.tsx  # Main booking interface
│   │   ├── DashboardPage.tsx # Admin dashboard
│   │   └── ProcurementPage.tsx
│   ├── services/             # API integration
│   │   └── api.ts            # Backend API calls
│   ├── assets/               # Images, fonts, etc.
│   ├── App.tsx               # Main app component
│   └── index.tsx             # Entry point
├── package.json              # Dependencies
└── tsconfig.json             # TypeScript config
```

---

## 🎨 Features

### **Authentication**
- ✅ Login with email/password
- ✅ User registration
- ✅ Email OTP verification
- ✅ JWT token management
- ✅ Auto-logout on token expiry

### **Room Management**
- ✅ View all available rooms
- ✅ Filter by category (conference, lab, etc.)
- ✅ Filter by availability status
- ✅ Room images and details
- ✅ Capacity information
- ✅ Amenities display

### **Booking System**
- ✅ Interactive calendar date picker
- ✅ Room schedule viewer (hourly breakdown)
- ✅ Multi-day navigation
- ✅ Booking type selection (hourly, full-day, multi-day, weekly)
- ✅ Real-time availability checking
- ✅ Form validation
- ✅ Success/error notifications

### **UI/UX**
- ✅ Professional corporate design
- ✅ Fully responsive (mobile to desktop)
- ✅ Accessibility features
- ✅ Loading states
- ✅ Error handling
- ✅ Clean, sharp design (no rounded corners)

---

## 🔄 Development Workflow

### **Daily Development:**

1. **Start Backend** (in backend terminal):
   ```bash
   cd backend
   python start_server.py
   ```

2. **Start Frontend** (in frontend terminal):
   ```bash
   cd frontend
   npm start
   ```

3. **Make changes** - React auto-reloads on file save

4. **Test** - Changes appear immediately in browser

---

## 🛠️ Useful Commands

### **Development:**
```bash
npm start              # Start development server
npm test               # Run tests
npm run build          # Build for production
```

### **Cleaning:**
```bash
npm run clean          # Clean cache (if exists)
rm -rf node_modules    # Remove dependencies
npm install            # Reinstall fresh
```

### **Linting:**
```bash
npm run lint           # Check code quality (if configured)
```

---

## 🔗 API Integration

The frontend connects to backend via **http://localhost:8000/api/**

### **API Service Location:**
`src/services/api.ts`

### **Key Settings:**
```typescript
const API_BASE_URL = 'http://localhost:8000/api';
const DEV_MODE = false; // Set to true for mock data
```

### **Authentication Flow:**
1. User logs in → Frontend calls `/api/auth/login/`
2. Backend returns JWT tokens (access + refresh)
3. Tokens stored in localStorage
4. All subsequent API calls include: `Authorization: Bearer {token}`
5. Token auto-refreshes when expired

---

## 🎯 Login Credentials

Use the accounts created by backend setup:

| Role | Email | Password |
|------|-------|----------|
| **Super Admin** | admin@icpac.net | admin123 |
| Procurement | procurement@icpac.net | procurement123 |
| Regular User | user@icpac.net | user123 |

**OR create your own account:**
1. Click "Sign up" on login page
2. Fill in First Name, Last Name, Email (@icpac.net or @igad.int)
3. Create password
4. Verify email with OTP code (printed in backend console)

---

## 📱 Responsive Breakpoints

| Device | Breakpoint | Columns |
|--------|-----------|---------|
| Mobile (xs) | < 600px | 1 column |
| Tablet (sm) | 600-900px | 2 columns |
| Desktop (md) | 900-1200px | 3 columns |
| Large (lg) | 1200-1536px | 3-4 columns |
| XL (xl) | > 1536px | 3 columns |

---

## 🎨 Design System

### **Colors:**
- **Primary Green:** `#044E36` (ICPAC brand)
- **Accent Blue:** `#0284C7` (Date section)
- **Accent Orange:** `#F97316` (Meeting spaces)
- **Dark Gray:** `#1F2937` (Text, buttons)
- **Success Green:** `#10B981`
- **Warning Orange:** `#F59E0B`
- **Error Red:** `#EF4444`

### **Typography:**
- **Headings:** Uppercase, letter-spacing 0.5px
- **Font Weights:** 600-700 for headings, 500 for body
- **No rounded corners:** Professional sharp edges

---

## 🚀 Production Build

### **Build for Production:**
```bash
npm run build
```

Creates optimized bundle in `build/` folder.

### **Test Production Build:**
```bash
# Install serve
npm install -g serve

# Serve production build
serve -s build -p 3000
```

---

## 📝 Environment Variables

Create `.env` in frontend folder (optional):

```env
# Backend API URL
REACT_APP_API_URL=http://localhost:8000/api

# App Configuration
REACT_APP_NAME=ICPAC Booking System
REACT_APP_VERSION=1.0
```

---

## ✅ Success Checklist

- [ ] Node.js installed (16+)
- [ ] Dependencies installed (`npm install`)
- [ ] Backend is running on port 8000
- [ ] Frontend starts on port 3000
- [ ] Can access login page
- [ ] Can login with admin@icpac.net
- [ ] Can see rooms on booking board
- [ ] Can create bookings
- [ ] No console errors

**If all checked, you're ready to develop!** 🎉

---

## 🔗 Related Documentation

- **Backend Setup:** `backend/SETUP_GUIDE.md`
- **API Documentation:** `backend/API_DOCUMENTATION.md`
- **PostgreSQL Setup:** `backend/POSTGRESQL_SETUP.md`

---

**Version:** 1.0  
**Last Updated:** October 2025  
**React Version:** 18.x  
**TypeScript Version:** 4.x
