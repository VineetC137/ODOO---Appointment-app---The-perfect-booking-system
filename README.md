# ODOO - Appointment App - The Perfect Booking System

An Appointment Booking System that lets users schedule services in real time based on availability, while organizers manage slots, resources, and bookings efficiently with features like capacity control, payments, and conflict-free scheduling.

A full-stack appointment booking app built with Node.js, React, and SQLite.

## Development Timeline

- **HOUR 1**: Planning the working and all stuff
- **HOUR 2**: Finalised UI and Workflow, trying to create basic Prototype  
- **HOUR 3&4**: Working on prototype

## Tech Stack

- **Backend:** Node.js, Express, TypeScript, Prisma, SQLite
- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Auth:** JWT + bcrypt

## Getting Started

### Backend

```bash
cd backend
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm run dev
```

Runs on `http://localhost:3000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`

## Test Accounts

| Email | Password |
|-------|----------|
| john@example.com | password123 |
| jane@example.com | password123 |
| test@example.com | password123 |

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/services` | List services |
| GET | `/api/resources` | List resources |
| GET | `/api/availability?resourceId=&date=` | Available slots |
| POST | `/api/bookings` | Create booking |
| GET | `/api/bookings` | My bookings |
| PATCH | `/api/bookings/:id/cancel` | Cancel booking |

## Project Structure

```
backend/
  prisma/schema.prisma     # DB schema
  src/
    routes/                # API routes
    middleware/            # Auth, error handling
    config/database.ts     # Prisma client
    seed.ts                # Test data
frontend/
  src/
    pages/                 # Login, Services, Booking, MyBookings
    components/            # ProtectedRoute
    context/AuthContext.tsx
    services/api.ts        # Axios API client
```
