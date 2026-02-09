# Database Setup Guide

This guide helps you set up the database for the Celine Hair Braiding application.

## Prerequisites

- Docker and Docker Compose installed
- Node.js and npm/yarn/bun installed

## Quick Start

1. **Start the PostgreSQL database:**
   ```bash
   docker compose up -d
   ```

2. **Apply all migrations:**
   ```bash
   npx prisma migrate deploy
   ```
   
   Or for development:
   ```bash
   npx prisma migrate dev
   ```

3. **Seed the database (optional):**
   ```bash
   npx prisma db seed
   ```

## Database Configuration

The application uses the following database connection:
- **Host:** localhost
- **Port:** 5433
- **Database:** celine_hair
- **User:** postgres
- **Password:** postgres

This is configured in your `.env` file:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/celine_hair?schema=public"
```

## Migration Order

Migrations are applied in chronological order:

1. `20260208220000_enable_btree_gist` - Enables the btree_gist extension (required for exclusion constraints)
2. `20260208220247_init` - Creates all tables and basic constraints
3. `20260208220031_booking_exclusion` - Adds exclusion constraint to prevent overlapping appointments

## Important Database Features

### btree_gist Extension
The application uses PostgreSQL's `btree_gist` extension to enable exclusion constraints with timestamp ranges. This prevents double-booking at the database level.

### Exclusion Constraint
The `Appointment` table has an exclusion constraint that prevents overlapping CONFIRMED appointments:

```sql
EXCLUDE USING gist (
  tstzrange("startAt", "endAt", '[)') WITH &&
)
WHERE (status = 'CONFIRMED');
```

This ensures:
- No two CONFIRMED appointments can overlap
- Buffer time is automatically enforced (since `endAt` includes buffer)
- Cancelled appointments don't block time slots

## Resetting the Database

If you need to start fresh:

```bash
# Stop and remove the database
docker compose down -v

# Start it again
docker compose up -d

# Apply migrations
npx prisma migrate deploy

# Seed (optional)
npx prisma db seed
```

## Alternative: Prisma Postgres

If you prefer using Prisma's development Postgres server instead of Docker:

1. Update your `.env` file to use the alternative connection string:
   ```
   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:51214/template1?sslmode=disable"
   ```

2. Start Prisma Postgres:
   ```bash
   npx prisma dev --detach --port 51213 --db-port 51214 --shadow-db-port 51215
   ```

## Troubleshooting

### "Extension btree_gist does not exist"
Run the migrations in order. The first migration creates this extension.

### "Cannot connect to database"
- Check that Docker is running: `docker ps`
- Check that the database container is healthy: `docker compose ps`
- Verify the port isn't in use: `lsof -i :5433`

### "Migration failed"
- Reset the database (see "Resetting the Database" above)
- Ensure all migrations are applied in order
- Check that the btree_gist extension is enabled

## Production Deployment

For production (e.g., Vercel + Neon/Supabase):

1. Create a production PostgreSQL database
2. Set the `DATABASE_URL` environment variable in your hosting platform
3. Ensure the btree_gist extension is enabled in production
4. Run migrations: `npx prisma migrate deploy`
5. Update `ADMIN_SECRET` to a strong random value
