# TravelVerse

A full-stack travel discovery platform built with React and Express. Travelers can explore landmarks, browse events, and register for experiences. Content managers can create, update, and remove listings.

## Tech Stack

| Layer    | Technologies                          |
|----------|---------------------------------------|
| Frontend | React, Vite, Tailwind CSS, React Router |
| Backend  | Node.js, Express                      |
| Database | MongoDB (in-memory fallback for local dev) |

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
```

**`backend/.env`**
```env
MONGODB_URI=mongodb+srv://user:<password>@cluster0.evx20hq.mongodb.net/?appName=Cluster0
PORT=4000
CORS_ORIGIN=http://localhost:5173
```

> If `MONGODB_URI` is omitted, the backend falls back to an in-memory store for local demos.

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
| GET | `/api/landmarks` | List landmarks |
| GET | `/api/landmarks/:id` | Landmark detail |
| POST | `/api/landmarks` | Create landmark |
| PUT | `/api/landmarks/:id` | Update landmark |
| DELETE | `/api/landmarks/:id` | Delete landmark |
| GET | `/api/events` | List events |
| POST | `/api/events` | Create event |
| DELETE | `/api/events/:id` | Delete event |
| POST | `/api/events/:id/register` | Register for event |
| POST | `/api/track` | Track interaction |
| GET | `/api/stats/summary` | Usage stats |

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
Deploy as a standalone Node/Express service with environment variables configured on your host.

## Notes

- Auth state is persisted in `localStorage` on the frontend.
- Landmark images and audio are transmitted as base64 strings.
- Roles supported: `traveler` and `content-manager`.
