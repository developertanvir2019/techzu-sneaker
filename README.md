# 👟 TechZu Sneaker Drop — Real-Time Inventory System

A high-concurrency sneaker drop platform with real-time stock tracking, 60-second reservation expiry, and live WebSocket updates.

**Tech Stack:** Node.js · Express · Prisma · PostgreSQL (Neon) · Redis (Upstash) · BullMQ · Socket.IO · React · Vite · Tailwind CSS

---

## 🚀 Local Setup

### Prerequisites

- Node.js ≥ 18
- PostgreSQL database (or [Neon](https://neon.tech) serverless)
- Redis instance (or [Upstash](https://upstash.com) serverless)

### 1. Clone & Install

```bash
git clone https://github.com/developertanvir2019/techzu-sneaker.git
cd techzu-sneaker

# Backend
cd sneaker-drop-backend
npm install

# Frontend
cd ../sneaker-drop-frontend
npm install
```

### 2. Configure Environment

**Backend** — create `sneaker-drop-backend/.env`:

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
REDIS_URL="rediss://default:password@your-endpoint.upstash.io:6379"
PORT=3001
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

**Frontend** — create `sneaker-drop-frontend/.env`:

```env
VITE_API_URL=http://localhost:3001
VITE_SOCKET_URL=http://localhost:3001
```

### 3. Database Setup

```bash
cd sneaker-drop-backend
npx prisma generate
npx prisma db push        # sync schema to DB
npm run db:seed            # (optional) seed sample data
```

### 4. Run

```bash
# Terminal 1 — Backend (http://localhost:3001)
cd sneaker-drop-backend
npm run dev

# Terminal 2 — Frontend (http://localhost:5173)
cd sneaker-drop-frontend
npm run dev
```

---

### Example: Create a Drop

```bash
curl -X POST http://localhost:3001/api/drops \
  -H "Content-Type: application/json" \
  -d '{"name":"Air Jordan 1","price":18000,"totalStock":100,"startTime":"2026-03-29T00:00:00Z"}'
```

---

## 🏗️ Architecture Decisions

### 60-Second Reservation Expiry

The expiry is handled by **BullMQ delayed jobs** backed by Redis — not `setTimeout` or cron polling.

**Flow:**

1. User clicks "Reserve" → backend decrements `availableStock` inside a **Prisma transaction** and creates a `Reservation` record with `expiresAt` timestamp
2. A BullMQ job is enqueued with a **60,000 ms delay** (`scheduleReservationExpiry`)
3. After exactly 60 seconds, the `reservationWorker` picks up the job:
   - Checks if reservation is still `ACTIVE` (skips if already `COMPLETED`)
   - Marks it `EXPIRED` and **restores stock** atomically in a transaction
   - Emits a `stock:update` + `reservation:expired` WebSocket event so the UI updates instantly

**Why BullMQ?** — Delayed jobs survive server restarts, scale horizontally, and have built-in retry with exponential backoff (3 attempts). Unlike `setTimeout`, jobs persist in Redis and won't be lost on crash.

---

### Concurrency: Preventing Overselling

Multiple users hitting "Reserve" on the last item simultaneously is handled at **two layers**:

#### Layer 1 — Serializable Transaction


#### Layer 2 — Atomic WHERE Guard


## 🔄 Real-Time Flow

```
User clicks Reserve
       │
       ▼
[POST /api/reservations]
       │
       ├─ Prisma transaction (decrement stock + create reservation)
       ├─ BullMQ: schedule expiry job (60s delay)
       └─ Socket.IO: emit stock:update → all clients refresh
       
       ... 60 seconds pass ...
       
[BullMQ Worker fires]
       │
       ├─ Transaction: mark EXPIRED + restore stock
       └─ Socket.IO: emit reservation:expired + stock:update
```

---
