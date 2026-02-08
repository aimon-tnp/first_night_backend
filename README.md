# first_night_backend

Quick setup and prerequisites for the project.

**Recommended environment**
- macOS / Linux (commands below assume zsh)
- Node.js: v20.x (tested with v20.20.0)
- npm: v10.x (tested with v10.8.2 bundled with Node v20)
- nvm (recommended) to manage Node versions
- Optional: `psql` if you want to run SQL locally

## Install nvm + Node (if needed)
```bash
# Install nvm (if you don't have it)
curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

# Install and use Node v20
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node -v   # should print v20.x
npm -v    # should print 10.x (e.g. 10.8.2)
```

## Clone & install
```bash
git clone <repo-url>
cd first_night_backend
npm install
```

## Environment variables
Create a `.env` file (do NOT commit it). Required keys used by the project:
- `PORT` (optional, defaults to 8080)
- `DATABASE_URL` (pgbouncer / pooler URL for Prisma in transaction mode)
- `DIRECT_URL` (direct DB URL / session mode for schema changes)
- `SUPABASE_URL` and `SUPABASE_KEY` (if using Supabase SDK)

Create a `.env.example` with placeholder values (no secrets) for repo contributors.

## Prisma (DB)
This project uses Prisma. After setting `.env` with `DIRECT_URL`/`DATABASE_URL`:
```bash
# Generate Prisma client (after schema edits)
npx prisma generate

# Push schema to DB (creates/updates tables)
# Use --accept-data-loss with caution in production
npx prisma db push --accept-data-loss
```

If you prefer migrations, use `npx prisma migrate dev` instead (requires a writable DB and migration workflow).

## Development
```bash
# Start in development (nodemon)
npm run dev

# Start production
npm start
```