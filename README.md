# first_night_backend

Backend for First Night app. Built with Node.js, Express, and Prisma.

## Prerequisites

- Node.js v20.x
- npm v10.x

## Setup

Copy `.env.example` to `.env` and fill in required values:

```bash
cp .env.example .env
npm install
```

**Environment variables:**
- `PORT` (optional, defaults to 8080)
- `DATABASE_URL` (pgbouncer / pooler URL for Prisma)
- `DIRECT_URL` (direct DB URL for schema changes)
- `SUPABASE_URL` and `SUPABASE_KEY` (optional)

## Database

Sync schema to database:

```bash
# Generate Prisma client
npx prisma generate

# Push schema changes to DB
npx prisma db push

# Or use migrations
npx prisma migrate dev --name <description>
```

## Running

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```