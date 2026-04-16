# TravelVerse Backend

Backend API for TravelVerse V2 auth, bookings, live crowd intelligence, social activity, content management, and analytics.

## Environment

Create a `.env` file or set environment variables:

```bash
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://user:password@cluster.example.mongodb.net/travelverse
MONGODB_DB_NAME=travelverse
JWT_SECRET=replace-with-at-least-32-random-bytes
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
FRONTEND_URL=http://localhost:5173
STRIPE_SECRET_KEY=sk_test_replace_me
STRIPE_WEBHOOK_SECRET=whsec_replace_me
REDIS_URL=rediss://default:password@upstash-host:6379
CROWD_REFRESH_MS=30000
UPLOAD_MAX_BYTES=8388608
```

If `MONGODB_URI` is not set or MongoDB is unavailable, the app falls back to an in-memory store for local demos.

## Run

```bash
npm install
npm run dev
```

## Endpoints

- `GET /api/health`
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/bookings/checkout`
- `GET /api/bookings/history`
- `POST /api/webhooks/stripe`
- `GET /api/landmarks/:id/crowd`
- `GET /api/friends/activity`
- `POST /api/checkins`
- `POST /api/track`
- `GET /api/stats/summary`

Use `Authorization: Bearer <jwt>` for protected traveler, content-manager, and admin routes.
