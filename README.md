# BookFlow — Appointment Booking System

Full-stack appointment booking app. No database server required — uses SQLite.

## Stack

- **Frontend**: React 19 + TypeScript + Tailwind CSS v3 + React Router 7 (port 4000)
- **Backend**: Node.js + Express + TypeScript + Prisma ORM (port 3001)
- **Database**: SQLite (file-based, zero config)

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (4000)                       │
│  React + TypeScript + Tailwind CSS + React Router           │
│                                                             │
│  Pages: Login · SignUp · OTPVerify · ServiceBrowser         │
│         BookingFlow · MyBookings · OrganiserDashboard        │
│         AdminDashboard                                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP / REST (axios)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                        Backend (3001)                        │
│  Express + TypeScript + Prisma ORM                          │
│                                                             │
│  Middleware: JWT Auth · Rate Limiting · Structured Logging  │
│                                                             │
│  Routes: /api/auth · /api/services · /api/resources         │
│          /api/availability · /api/bookings · /api/payments  │
│          /api/dashboard                                     │
└────────────────────────┬────────────────────────────────────┘
                         │ Prisma ORM
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   SQLite Database                            │
│  backend/prisma/dev.db                                      │
│                                                             │
│  Tables: User · Service · Resource · ServiceResource        │
│          Schedule · Exception · Booking · Payment           │
└─────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Start both servers

```bash
npm run dev
```

- Backend: http://localhost:3001
- Frontend: http://localhost:4000

> The SQLite database (`backend/prisma/dev.db`) is already migrated and seeded.

---

## Test Credentials (password: `password123`)

| Role      | Email                      |
|-----------|----------------------------|
| Customer  | customer@bookflow.com      |
| Organiser | organiser@bookflow.com     |
| Admin     | admin@bookflow.com         |

---

## Features by Role

### Customer
- Browse and search services with price/duration filters
- Book appointments (date + time slot selection)
- Payment checkout (mock card form)
- View upcoming and past bookings
- Reschedule upcoming bookings
- Cancel bookings

### Organiser
- Dashboard with metrics (total bookings, upcoming, monthly revenue)
- Manage bookings (confirm / cancel)
- Create and delete services
- Create and delete resources (staff, room, equipment)
- Manage weekly schedules per resource (day, start/end time, slot duration)
- Manage exceptions (blocked dates) per resource

### Admin
- System-wide metrics
- View all users with roles and status
- Deactivate user accounts
- View organiser stats

---

## API Endpoints

### Auth

| Method | Path | Auth | Description | Request Body |
|--------|------|------|-------------|--------------|
| POST | /api/auth/register | — | Register new user | `{ email, password, role, firstName, lastName, phone? }` |
| POST | /api/auth/login | — | Login | `{ email, password }` |
| POST | /api/auth/verify-otp | — | Verify OTP | `{ userId, otp }` |
| POST | /api/auth/resend-otp | — | Resend OTP | `{ userId }` |
| POST | /api/auth/logout | JWT | Logout | — |

**Login response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "role": "CUSTOMER", "firstName": "...", "lastName": "..." },
    "token": "eyJ..."
  }
}
```

### Services

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/services | — | List services (supports `?minPrice=&maxPrice=&duration=`) |
| GET | /api/services/:id | — | Get service by ID |
| POST | /api/services | Organiser | Create service |
| PUT | /api/services/:id | Organiser | Update service |
| DELETE | /api/services/:id | Organiser | Delete service |
| GET | /api/organiser/services | Organiser | Get own services |

### Resources

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/resources | Organiser | List own resources |
| POST | /api/resources | Organiser | Create resource |
| PUT | /api/resources/:id | Organiser | Update resource |
| DELETE | /api/resources/:id | Organiser | Delete resource |
| GET | /api/resources/:id/schedules | Organiser | Get schedules |
| POST | /api/resources/:id/schedules | Organiser | Create schedule |
| DELETE | /api/schedules/:id | Organiser | Delete schedule |
| GET | /api/resources/:id/exceptions | Organiser | Get exceptions |
| POST | /api/resources/:id/exceptions | Organiser | Create exception |
| DELETE | /api/exceptions/:id | Organiser | Delete exception |

### Availability

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/availability | JWT | Get slots (`?resourceId=&date=YYYY-MM-DD`) |

**Response:**
```json
{
  "success": true,
  "data": [
    { "time": "2026-05-10T09:00:00.000Z", "available": true, "remainingCapacity": 2 }
  ]
}
```

### Bookings

| Method | Path | Auth | Description | Request Body |
|--------|------|------|-------------|--------------|
| GET | /api/bookings | JWT | List bookings (role-filtered) | — |
| GET | /api/bookings/:id | JWT | Get booking by ID | — |
| POST | /api/bookings | Customer | Create booking | `{ serviceId, resourceId, slotTime, customerName, customerEmail, customerPhone, notes? }` |
| PUT | /api/bookings/:id/status | Organiser | Update status | `{ status: "BOOKED" \| "CANCELLED" }` |
| PUT | /api/bookings/:id/reschedule | Customer | Reschedule | `{ newSlotTime }` |
| DELETE | /api/bookings/:id | JWT | Cancel booking | — |

### Payments

| Method | Path | Auth | Description | Request Body |
|--------|------|------|-------------|--------------|
| POST | /api/payments | Customer | Process payment | `{ bookingId, amount }` |
| GET | /api/payments/:transactionId | JWT | Get payment status | — |

### Dashboards

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/dashboard/organiser | Organiser | Organiser metrics + recent bookings |
| GET | /api/dashboard/admin | Admin | System-wide metrics + users |
| PUT | /api/users/:id/deactivate | Admin | Deactivate user |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `DATABASE_URL` | `file:./prisma/dev.db` | SQLite database path |
| `JWT_SECRET` | `your-secret-key` | JWT signing secret (change in production) |
| `NODE_ENV` | `development` | Environment mode |

---

## Testing

### Run backend unit tests

```bash
cd backend
npm test
```

Tests cover:
- **availabilityService**: slot generation, past slot exclusion, capacity calculation
- **bookingService**: valid/invalid status transitions
- **authService**: OTP generation (6 digits), OTP expiry validation

### Watch mode

```bash
cd backend
npm run test:watch
```

---

## Database Management

### Re-seed the database

```bash
cd backend
npm run db:seed
```

### Reset the database

```bash
cd backend
npx prisma migrate reset
```

### Open Prisma Studio (GUI)

```bash
cd backend
npm run db:studio
```

---

## Logging

The backend writes structured logs to `backend/logs/app.log`:

```
[2026-05-02T10:00:00Z] POST /api/auth/login 200 45ms userId=-
[2026-05-02T10:00:05Z] INFO AUTH_LOGIN_SUCCESS {"email":"user@example.com"}
[2026-05-02T10:00:10Z] INFO BOOKING_CREATED {"bookingId":"...","customerId":"..."}
```

---

## Rate Limiting

- **Auth endpoints** (`/api/auth/*`): 10 requests per 15 minutes per IP
- **All API endpoints**: 100 requests per 15 minutes per IP

---

## Troubleshooting

### Backend won't start
- Check that port 3001 is free: `netstat -an | grep 3001`
- Ensure `backend/.env` exists (copy from `backend/.env.example`)
- Run `cd backend && npx prisma generate` if Prisma client is missing

### Frontend won't start
- Check that port 4000 is free
- Run `cd frontend && npm install` if node_modules is missing

### "Cannot connect to backend" error
- Ensure the backend is running on port 3001
- Check CORS — the backend allows all origins in development

### OTP not received
- OTPs are logged to the **server console** (mock email)
- Look for: `📧 [MOCK EMAIL] OTP for user <id>: <otp>`
- OTPs expire after 10 minutes; use "Resend OTP" if expired

### Bookings not showing
- Ensure you're logged in with the correct role
- Customers see their own bookings; organisers see bookings for their services

### Database locked error
- Only one process should access the SQLite file at a time
- Stop any running `prisma studio` instances
