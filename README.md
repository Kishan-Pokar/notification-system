![Tests](https://github.com/Kishan-Pokar/notification-system/actions/workflows/test.yml/badge.svg)
# Webhook Delivery System

A production-grade event-driven webhook delivery system built with Node.js, TypeScript, BullMQ, Redis, and PostgreSQL. Instead of manually pushing HTTP requests to multiple endpoints every time something happens, you send one event to this system and it handles guaranteed delivery automatically — with retries, failure tracking, and a full audit trail.

---

## The Problem This Solves

When you need to notify multiple external systems that something happened, the naive approach is to fire HTTP requests directly and hope they succeed. If the target server is down, you lose the notification. If you need to retry, you build that logic yourself. If something fails at 3am, you have no idea what happened or why.

This system solves that. Send one event. It finds every subscribed endpoint, delivers to each independently, retries on failure with exponential backoff, and logs every attempt so you always know exactly what happened.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT / USER                     │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (API Key Auth)
┌──────────────────────▼──────────────────────────────┐
│                   API LAYER                          │
│              (Express + TypeScript)                  │
│                                                      │
│  POST /auth/register     → create account            │
│  POST /endpoints         → register webhook endpoint │
│  POST /events            → trigger an event          │
│  GET  /deliveries        → list all events           │
│  GET  /deliveries/:id    → event with delivery stats │
└──────────────────────┬──────────────────────────────┘
                       │
          ┌────────────▼────────────┐
          │      JOB QUEUE          │
          │   BullMQ + Redis        │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │    WEBHOOK WORKER       │
          │                         │
          │  - HTTP POST to target  │
          │  - HMAC signature       │
          │  - Exponential backoff  │
          │  - Delivery logging     │
          └────────────┬────────────┘
                       │
          ┌────────────▼────────────┐
          │      PostgreSQL         │
          │                         │
          │  - users                │
          │  - endpoints            │
          │  - endpoint_subscriptions│
          │  - events               │
          │  - delivery_attempts    │
          └─────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Language | TypeScript (strict mode) |
| Framework | Express |
| Job Queue | BullMQ |
| Queue Backend | Redis |
| Database | PostgreSQL |
| Infrastructure | Docker + Docker Compose |
| Validation | Zod |
| Auth | API Key |
| Signing | HMAC SHA-256 |

---

## Key Design Decisions

### Event-Driven over API Proxy
This system is not a proxy. A proxy forwards requests in real time and both sides wait. This system is event-driven — you fire an event and the system delivers asynchronously. Your application never waits for delivery. No polling. No manual retries. Just fire and observe.

### BullMQ over Custom Retry Logic
BullMQ provides exponential backoff, automatic retries, job persistence, worker concurrency, and failure events out of the box. Rolling a custom retry system would be less reliable, less scalable, and more code to maintain. The engineering challenge here is not the queue — it's everything around it.

### Exponential Backoff over Fixed Intervals
Fixed interval retries hammer a recovering server at the same rate that caused the failure. Exponential backoff gives the target server progressively more time to recover — 10s, 20s, 40s, 80s, 160s. Combined with jitter this prevents thundering herd when many jobs fail simultaneously.

### At-Least-Once Delivery
Exactly-once delivery requires distributed transactions which introduce significant complexity and latency. At-least-once delivery means we guarantee the notification reaches the target — occasionally a target might receive a duplicate on edge cases. This is the industry standard approach used by Stripe, GitHub, and most webhook systems. Receivers are expected to handle idempotency on their end.

### Soft Delete for Endpoints
Endpoints are not hard deleted. They are marked `is_active = false`. This preserves delivery history for analysis, and makes it trivial to add endpoint reactivation as a future feature without losing any historical data.

### API Key Auth over JWT
This system has no frontend. Users are developers integrating it into their backends. Requiring a login flow to get a JWT token on every integration is unnecessary friction. API keys are issued once on registration and used directly on every request — the same model used by Stripe, Twilio, and SendGrid.

### Service-Repository Separation
Controllers handle HTTP only. Services own business logic. Repositories own database queries. This separation means business logic is testable without HTTP, database queries are swappable without touching business logic, and the codebase remains maintainable as it grows.

---

## Delivery Guarantee

- **5 attempts** per endpoint per event
- **Exponential backoff** starting at 10 seconds
- **10 second timeout** on every HTTP request
- **HMAC signature** on every outgoing request for receiver verification
- **Full audit trail** — every attempt logged with status, HTTP code, response body, duration, and error message
- **Independent delivery** — one endpoint failing never affects delivery to other endpoints

---

## Getting Started

### Prerequisites
- Docker Desktop

### Setup

**1. Clone the repository**
```bash
git clone <repo-url>
cd webhook-delivery-system
```

**2. Create environment file**
```bash
cp .env.example .env
```

**3. Start infrastructure**
```bash
docker-compose up -d
```

**4. Install dependencies**
```bash
npm install
```

**5. Start the server**
```bash
npm run dev
```

Server runs on `http://localhost:5000`

---

## API Reference

### Authentication
All endpoints except `/auth/register` and `/auth/login` require an API key header:
```
x-api-key: your_api_key_here
```

### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "name": "Your Name",
  "email": "you@example.com",
  "password": "yourpassword"
}
```
Returns your `api_key`. Save it — it's shown once.

---

### Register Endpoint
```http
POST /endpoints
x-api-key: your_api_key

{
  "url": "https://your-server.com/webhook",
  "event_types": ["payment.success", "order.delivered"]
}
```
Returns endpoint `id` and `secret`. Save both.

---

### Add Event Type to Endpoint
```http
POST /endpoints/:id/subscriptions
x-api-key: your_api_key

{
  "event_type": "user.created"
}
```

---

### Remove Event Type from Endpoint
```http
DELETE /endpoints/:id/subscriptions/:event_type
x-api-key: your_api_key
```

---

### Delete Endpoint
```http
DELETE /endpoints/:id
x-api-key: your_api_key
```

---

### Trigger Event
```http
POST /events
x-api-key: your_api_key

{
  "event_type": "payment.success",
  "payload": {
    "order_id": "xyz-789",
    "amount": 500
  }
}
```
Returns immediately with event `id` and status `pending`. Delivery happens asynchronously.

---

### List All Events
```http
GET /deliveries
x-api-key: your_api_key
```

---

### Get Event Delivery Details
```http
GET /deliveries/:id
x-api-key: your_api_key
```
Returns event with calculated delivery stats:
```json
{
  "id": "abc-123",
  "event_type": "payment.success",
  "status": "delivered",
  "total_endpoints": 3,
  "successful_endpoints": 2,
  "failed_endpoints": 1,
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

### HMAC Signature Verification
Every outgoing request includes an `X-Webhook-Signature` header. Receivers can verify the request is genuine:

```typescript
import crypto from 'crypto';

const signature = req.headers['x-webhook-signature'];
const expected = crypto
  .createHmac('sha256', your_endpoint_secret)
  .update(JSON.stringify(req.body))
  .digest('hex');

if (signature !== expected) {
  // reject the request
}
```

---

## Known Limitations

- **Single Redis instance** — single point of failure. Production would use Redis Sentinel or Redis Cluster for high availability.
- **Single PostgreSQL instance** — production would use read replicas and a connection pooler like PgBouncer.
- **No frontend** — all interactions are via API. A dashboard for endpoint management is a planned future improvement.

---

## Future Improvements

- Frontend dashboard for endpoint and event management
- Endpoint reactivation
- Per-endpoint rate limiting
- Event replay — manually retry exhausted events
- Webhook delivery analytics and charts
- Multi-tenancy support

---

## Environment Variables

```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/webhooks
JWT_SECRET=your_jwt_secret
REDIS_HOST=localhost
REDIS_PORT=6379
NODE_ENV=development
```
