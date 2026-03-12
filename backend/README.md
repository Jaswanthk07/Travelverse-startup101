# TravelVerse Backend

Backend API for TravelVerse MVP auth and interaction tracking.

## Environment

Create a `.env` file or set environment variables:

```bash
MONGODB_URI=mongodb+srv://user:user@cluster0.evx20hq.mongodb.net/?appName=Cluster0
PORT=4000
CORS_ORIGIN=http://localhost:5173
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
- `POST /api/track`
- `GET /api/stats/summary`
