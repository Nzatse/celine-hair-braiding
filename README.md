# Celine Hair Braiding — Custom Booking MVP

Fully custom booking (no third-party booking platform) built with Next.js App Router + Prisma + Postgres.

## Local setup

### 1) Start Postgres (Docker)

```bash
docker compose up -d
```

This repo maps Postgres to `localhost:5433` (to avoid conflicts with an existing local Postgres on `5432`).

### 2) Install dependencies

```bash
npm install
```

### 3) Migrate + generate + seed

```bash
npx prisma migrate dev
npx prisma generate
npm run seed
```

### 4) Run the app

```bash
npm run dev
```

Open http://localhost:3000

## Key routes

- Public booking flow: `/book`
- Services list: `/services`
- Admin dashboard: `/admin`

## Admin access (MVP)

Set `ADMIN_SECRET` in `.env`.

- Visit `/admin` and enter the secret.
- Admin APIs accept either the `admin` cookie (set by login) or an `x-admin-secret` header.

## Booking correctness notes

- Salon timezone: `America/Chicago` (configurable via `SALON_TIMEZONE`).
- Database storage: UTC using Postgres `timestamptz`.
- Double-booking prevention: a Postgres exclusion constraint (see the `*_booking_exclusion` migration).
