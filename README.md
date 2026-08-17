# BikeShare

Monorepo scaffold for BikeShare — a peer-to-peer bike rental platform (CASH-only in-person payments).

Structure:

- backend: Node.js + Express + MongoDB (Mongoose)
- frontend: React + Vite

See each folder's `package.json` for scripts. Create local `.env` files from the provided `.env.example` files before running.

Quick start (requires Node.js and MongoDB):

1. Backend

```bash
cd backend
npm install
# copy .env.example to .env and edit if needed
npm run dev
```

2. Frontend

```bash
cd frontend
npm install
# copy .env.example to .env
npm run dev
```

The frontend uses `VITE_API_URL` to talk to the backend; by default it points to `http://localhost:5000`.
