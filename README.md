# 👟 SneakerDrop — Real-Time Limited Edition Inventory System

A production-ready full-stack application for a limited edition sneaker drop with real-time inventory tracking, atomic reservation handling, and concurrency-safe purchasing.

## ⚡ Live Demo
> Add your Vercel URLs here after deployment.

**Frontend:** `https://sneaker-drop-frontend.vercel.app`  
**Backend:** `https://sneaker-drop-backend.vercel.app`

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js 18+
- A **Neon** PostgreSQL database ([neon.tech](https://neon.tech))
- An **Upstash** Redis instance ([upstash.com](https://upstash.com))

### 1. Clone & Setup

```bash
git clone <your-repo>
cd techzu_store
```

### 2. Configure Backend

```bash
cd sneaker-drop-backend
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DATABASE_URL="postgresql://user:pass@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:pass@ep-xxxx.us-east-1.aws.neon.tech/neondb?sslmode=require"
REDIS_URL="rediss://default:password@your-endpoint.upstash.io:6379"
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### 3. Run DB Migration & Seed

```bash
npm install
npm run db:migrate     # Creates all tables + indexes
npm run db:seed        # Seeds 5 demo users + 3 sneaker drops
```

### 4. Start Backend

```bash
npm run dev    # Starts Express + Socket.io + BullMQ worker on :3001
```

### 5. Configure & Start Frontend

```bash
cd ../sneaker-drop-frontend
cp .env.example .env   # VITE_API_URL=http://localhost:3001
npm install
npm run dev            # Starts Vite dev server on :5173
```

### 6. Open in Two Browser Windows

Open `http://localhost:5173` in **two** windows side-by-side to demo real-time sync.

---

## 🏗️ Architecture Decisions

### How I Handled 60-Second Expiration

**Primary: BullMQ Delayed Jobs (Redis)**
- When a reservation is created, a delayed job is enqueued with `delay: 60000ms` using a deterministic `jobId` (`expire-<reservationId>`) to prevent duplicates.
- The BullMQ worker processes the job at T+60s: checks if reservation is still `ACTIVE` inside a Prisma transaction, marks it `EXPIRED`, restores `availableStock`, and emits a `reservation:expired` WebSocket event.

**Fallback: `expiresAt` in DB**
- Every reservation stores `expiresAt` in PostgreSQL so the system can recover from Redis outages via a periodic cleanup cron if needed.

**Why not a cron job alone?** Cron granularity is typically 1 minute. BullMQ provides millisecond precision and guaranteed delivery with retry logic.

---

### How I Prevented Overselling (Concurrency)

The reservation system uses **two layers** of protection:

**Layer 1: PostgreSQL Serializable Transactions**
```typescript
await prisma.$transaction(async (tx) => {
  const drop = await tx.drop.findUnique({ where: { id: dropId } });
  if (drop.availableStock <= 0) throw new Error("Out of stock");
  
  await tx.drop.update({
    where: { id: dropId, availableStock: { gt: 0 } }, // ← Layer 2
    data: { availableStock: { decrement: 1 } },
  });
}, { isolationLevel: "Serializable" });
```

**Layer 2: Conditional WHERE clause**
- `availableStock: { gt: 0 }` in the `UPDATE` WHERE clause acts as a second atomic check — if two transactions race and both pass the `findUnique` check, only one will successfully execute the `UPDATE`. The other will get 0 affected rows and throw.

**Result:** Even if 1000 users click "Reserve" simultaneously for the last 1 item, the database guarantees exactly 1 succeeds.

---

## 🧱 Tech Stack & Folder Structure

### Backend (`sneaker-drop-backend/`)
```
src/
├── app.ts                  # Express + CORS + routes
├── server.ts               # HTTP + Socket.io + BullMQ startup
├── config/
│   ├── prisma.ts           # PrismaClient singleton
│   └── redis.ts            # IORedis (Upstash TLS-aware)
├── socket/index.ts         # Socket.io init + typed emitters
├── queue/reservationQueue.ts # BullMQ Queue
├── workers/reservationWorker.ts # Expiry worker
├── middlewares/errorHandler.ts
└── modules/
    ├── drop/               # controller + service + routes
    ├── reservation/        # Atomic reservation logic
    ├── purchase/           # Purchase flow
    └── user/               # Mock users
```

### Frontend (`sneaker-drop-frontend/`)
```
src/
├── app/store.ts            # Redux store
├── services/api.ts         # RTK Query (all endpoints)
├── socket/useSocket.ts     # WS hook → dispatch to Redux
├── features/
│   ├── drops/dropsSlice.ts # Live stock overrides
│   └── auth/authSlice.ts   # Selected user
├── components/             # DropCard, Buttons, Timer, Feed
└── pages/DashboardPage.tsx
```

---

## 📡 WebSocket Events

| Event | Payload | Description |
|-------|---------|-------------|
| `stock:update` | `{ id, availableStock, ... }` | Any stock change (reserve/expire/purchase) |
| `reservation:expired` | `{ reservationId, dropId, userId, availableStock }` | 60s timer fired |
| `purchase:confirmed` | `{ dropId, userId, username, availableStock }` | Successful purchase |

---

## 🔌 API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/drops` | All drops + top 3 purchasers |
| `POST` | `/api/drops` | Create a new drop |
| `GET` | `/api/drops/:id` | Single drop |
| `POST` | `/api/reservations` | Reserve an item (atomic) |
| `GET` | `/api/reservations/check?userId=&dropId=` | Check active reservation |
| `POST` | `/api/purchases` | Complete purchase |
| `GET` | `/api/users` | List all users |
| `POST` | `/api/users` | Create user |

---

## ☁️ Deployment (Vercel + Neon + Upstash)

### Backend on Vercel
1. Create `vercel.json` in `sneaker-drop-backend/`:
```json
{
  "version": 2,
  "builds": [{ "src": "src/server.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/server.ts" }]
}
```
2. Add env vars in Vercel dashboard (DATABASE_URL, DIRECT_URL, REDIS_URL, FRONTEND_URL)
3. `vercel --prod`

### Frontend on Vercel
1. Add `VITE_API_URL=https://your-backend.vercel.app` in Vercel env vars
2. `vercel --prod`

> **⚠️ Note on Vercel + Socket.io:** Vercel Serverless Functions don't support persistent WebSocket connections. For production, deploy the backend on **Railway**, **Render**, or **Fly.io** instead of Vercel Functions.

---

## 🔐 Security Notes
- Never commit `.env` files — use `.env.example` as a template
- All credentials go in Vercel's Environment Variables dashboard
- Neon uses SSL by default (`sslmode=require`)
- Upstash Redis uses TLS (`rediss://` protocol) — handled automatically
