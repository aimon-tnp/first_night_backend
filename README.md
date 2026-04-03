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
- `REDIS_HOST` (optional, defaults to localhost)
- `REDIS_PORT` (optional, defaults to 6379)
- `REDIS_PASSWORD` (optional)
- `REDIS_DB` (optional, defaults to 0)
- `REDIS_TLS` (optional, set to 'true' for TLS connection)

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

## Redis

Redis is used for token blacklisting on logout. Ensure Redis is running before starting the server.

**Start Redis (if not running):**
```bash
redis-server
# Or on macOS with Homebrew:
brew services start redis
```

**Check Redis connection:**
```bash
redis-cli
ping  # Should return PONG
```

**Kill process on port 6379 (if Redis is stuck):**
```bash
# On macOS/Linux:
lsof -i :6379                    # List process using port 6379
kill -9 <PID>                    # Kill the process (replace <PID> with actual process ID)

# Or in one command:
lsof -i :6379 | grep LISTEN | awk '{print $2}' | xargs kill -9

# On Windows (PowerShell):
Get-Process | Where-Object {$_.Port -eq 6379} | Stop-Process -Force
# Or use netstat to find and kill:
netstat -ano | findstr :6379
taskkill /PID <PID> /F
```

Redis configuration is loaded from environment variables or defaults to `localhost:6379`.

## Running

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

## API Documentation

The API is documented using Swagger/OpenAPI. Access the interactive API documentation:

**Development Server:**
- UI: http://localhost:8080/docs
- Spec: http://localhost:8080/docs.json

**Production Server (Render):**
- UI: https://first-night-backend.onrender.com/docs
- Spec: https://first-night-backend.onrender.com/docs.json

You can test API endpoints directly from the Swagger UI, view request/response schemas, and authenticate using your JWT token.