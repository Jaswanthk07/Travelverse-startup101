# TravelVerse

A full-stack travel discovery platform built with React and Express. Travelers can explore landmarks, browse events, check live crowd levels, follow friends, check in, and book experiences through Stripe Checkout. Content managers and admins can manage landmarks, events, and analytics.

## Tech Stack

| Layer    | Technologies                          |
|----------|---------------------------------------|
| Frontend | React, Vite, Tailwind CSS, React Router, Fuse.js, Socket.io Client, Stripe.js |
| Backend  | Node.js, Express, JWT, bcryptjs, Stripe, Socket.io, Redis |
| Database | MongoDB native driver (in-memory fallback for local dev) |

## Project Structure
```
.
├── frontend/   # Vite + React app
├── backend/    # Express REST API
└── package.json
```

## Getting Started

### 1. Install dependencies
```bash
npm --prefix frontend install
npm --prefix backend install
```

> **Windows PowerShell:** If blocked by execution policy, use `npm.cmd` instead of `npm`.

### 2. Configure environment

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:4000/api
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_replace_me
```

**`backend/.env`**
```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://user:<password>@cluster0.evx20hq.mongodb.net/travelverse
MONGODB_DB_NAME=travelverse
JWT_SECRET=replace-with-at-least-32-random-bytes
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
REDIS_URL=rediss://default:<password>@<upstash-host>:6379
CROWD_REFRESH_MS=30000
UPLOAD_MAX_BYTES=8388608
```

> If `MONGODB_URI` is omitted, the backend falls back to an in-memory store for local demos.
> Generate a strong JWT secret with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`.

### 3. Run locally
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

Frontend: `http://localhost:5173` · Backend: `http://localhost:4000`

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/signup` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Validate JWT session |
| GET | `/api/landmarks` | List landmarks |
| GET | `/api/search/landmarks` | Fuzzy/text-ready landmark search |
| GET | `/api/landmarks/:id` | Landmark detail |
| GET | `/api/landmarks/:id/crowd` | Live crowd estimate |
| POST | `/api/landmarks` | Create landmark |
| PUT | `/api/landmarks/:id` | Update landmark |
| DELETE | `/api/landmarks/:id` | Delete landmark |
| GET | `/api/events` | List events |
| POST | `/api/events` | Create event |
| DELETE | `/api/events/:id` | Delete event |
| POST | `/api/events/:id/register` | Register for event |
| POST | `/api/bookings/checkout` | Create Stripe Checkout booking |
| GET | `/api/bookings/history` | Traveler booking history |
| POST | `/api/webhooks/stripe` | Stripe webhook confirmation |
| GET | `/api/friends/activity` | Friend feed aggregation |
| GET | `/api/users/discover` | Find users to follow |
| POST | `/api/friends/follow/:userId` | Follow a traveler |
| POST | `/api/checkins` | Create a landmark check-in |
| POST | `/api/track` | Track interaction |
| GET | `/api/stats/summary` | Usage stats |

Protected create/edit/delete/admin routes require `Authorization: Bearer <jwt>`. Content routes allow `content-manager` and `admin`; traveler routes require an authenticated user.

## Scripts (from repo root)
```bash
npm run build   # Build the frontend
npm test        # Run backend test suite
```

## Deployment

### Frontend (Vercel)
Set the project root to `frontend` and use:
- **Install Command:** `npm install`
- **Build Command:** `npm run build`

> Do not use `npm.cmd` on Vercel — it's Windows-only and will fail in Linux environments.

### Backend
Deploy as a standalone Node/Express service on Railway or Render. Do not deploy the backend to Vercel because the live crowd layer uses WebSockets through Socket.io.

### Redis
Create an Upstash Redis database and set `REDIS_URL` to the TLS Redis URL. If Redis is unavailable, the backend uses an in-memory crowd cache for local demos.

### Stripe
Create a Checkout integration in Stripe and set:
- `STRIPE_SECRET_KEY` on the backend.
- `VITE_STRIPE_PUBLISHABLE_KEY` on the frontend.
- A webhook endpoint pointing to `https://<backend-domain>/api/webhooks/stripe`.
- `STRIPE_WEBHOOK_SECRET` from the webhook signing secret.

The webhook confirms `checkout.session.completed` and marks bookings as `confirmed`.

### MongoDB Indexes
Indexes are created automatically when the backend connects:
- Unique user email and landmark/event ids.
- Landmark text index for name, location, type, short description, and description.
- Booking, tracking, follow, check-in, and registration indexes.

## Notes

- Auth uses bcryptjs password hashes and JWT bearer tokens.
- Landmark images/audio can still be sent as base64 strings for MVP compatibility, with a protected upload endpoint available for content managers.
- Roles supported: `traveler`, `content-manager`, and protected `admin` access when seeded directly in the database.
