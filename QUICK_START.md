# 🚀 Quick Start Guide

## Current Status
✅ Backend dependencies installed  
✅ Prisma client generated  
⏳ Waiting for PostgreSQL setup  

## Next Steps

### 1. Start PostgreSQL (REQUIRED)

**Check if PostgreSQL is running:**
- Open Services app (Windows + R → type `services.msc`)
- Look for "postgresql-x64-14" or similar
- If Status is not "Running", right-click → Start

**Or use pgAdmin:**
- Open pgAdmin
- If it asks for password, enter your PostgreSQL password
- You should see your server in the left panel

### 2. Create Database

**Using pgAdmin (Easiest):**
1. Open pgAdmin
2. Expand "Servers" → "PostgreSQL 14" (or your version)
3. Right-click on "Databases"
4. Select "Create" → "Database..."
5. In "Database" field, type: `appointment_booking`
6. Click "Save"

**Using psql (Command Line):**
```bash
# Navigate to PostgreSQL bin folder
cd "C:\Program Files\PostgreSQL\14\bin"

# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE appointment_booking;

# Exit
\q
```

### 3. Run Backend

```bash
cd appointment-booking-mvp/backend

# Run migrations (creates tables)
npm run db:migrate

# Seed test data
npm run db:seed

# Start backend server
npm run dev
```

You should see:
```
🚀 Server started successfully!
📡 API running on http://localhost:5000
```

### 4. Run Frontend (New Terminal)

```bash
cd appointment-booking-mvp/frontend

# Install dependencies
npm install

# Start frontend
npm run dev
```

You should see:
```
Local: http://localhost:5173/
```

### 5. Test the App

1. Open browser: `http://localhost:5173`
2. Login with: `customer@bookflow.com` / `password123`
3. Browse services
4. Book an appointment!

## Troubleshooting

### "Can't reach database server"
- PostgreSQL is not running
- Start it from Services app or pgAdmin

### "Database does not exist"
- Create the database using pgAdmin (see Step 2 above)

### "Port 5000 already in use"
- Another app is using port 5000
- Change PORT in `backend/.env` to 5001
- Update frontend API URL in `frontend/src/services/api.ts`

### "Port 5173 already in use"
- Another Vite app is running
- Stop it or use a different port

## What You'll See

### Login Page
- Clean UI with email/password fields
- Test credentials displayed
- JWT authentication

### Service Browser
- Grid of service cards
- Search functionality
- Service details (duration, price)

### Booking Flow
- Date picker (2-week calendar)
- Real-time available time slots
- Capacity display ("X spots remaining")
- Customer details form
- Success confirmation

### My Bookings
- Upcoming appointments
- Past appointments
- Cancel functionality

## Demo Features

### Real-Time Availability
1. Select a service
2. Change dates in calendar
3. Watch slots update instantly
4. See remaining capacity per slot

### Double-Booking Prevention
1. Open two browser windows
2. Login as different customers
3. Try booking the same time slot
4. Only one will succeed!

## API Endpoints

Backend runs on `http://localhost:5000`

- `POST /api/auth/login` - Login
- `GET /api/services` - Get all services
- `GET /api/availability?resourceId=&date=` - Get available slots
- `POST /api/bookings` - Create booking
- `GET /api/customer/bookings` - Get customer bookings
- `DELETE /api/bookings/:id` - Cancel booking

## Database Access

View database in Prisma Studio:
```bash
cd backend
npm run db:studio
```

Opens at `http://localhost:5555`

## Tech Stack

- **Backend**: Node.js + Express + TypeScript + Prisma
- **Frontend**: React + TypeScript + Tailwind CSS
- **Database**: PostgreSQL
- **Auth**: JWT + bcrypt

## Key Features

✅ Transaction-based booking (prevents double-booking)  
✅ Real-time availability calculation  
✅ Capacity management  
✅ Clean architecture (Controllers → Services → Database)  
✅ Type-safe with TypeScript  
✅ Responsive UI matching Stitch designs  

## Need Help?

1. Check PostgreSQL is running
2. Check database exists
3. Check backend terminal for errors
4. Check frontend terminal for errors
5. Check browser console for errors

## Stop Servers

- Backend: `Ctrl+C` in backend terminal
- Frontend: `Ctrl+C` in frontend terminal
