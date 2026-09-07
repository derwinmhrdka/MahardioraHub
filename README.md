# DealHub

Affiliate deal aggregator + personal secondhand marketplace. Next.js (App Router), PostgreSQL, Prisma, Docker Compose + Caddy.

## Environment variables

Secrets and deploy-time config only (see `.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Compose sets this to the `db` service) |
| `ADMIN_USER` | Admin login username (Compose default: `admin`) |
| `ADMIN_PASS` | Admin login password (Compose default: `changeme`) |
| `PORT` | App listen port (default `3000`) |
| `NODE_ENV` | `production` in Docker |

Set `ADMIN_USER` / `ADMIN_PASS` in a local `.env` next to `docker-compose.yml`, or export them in your shell before compose. WhatsApp number, site name, and contact email live in the `Setting` table and are edited at `/admin/settings` — not via env vars.

## Run with Docker

```bash
# optional: copy .env.example to .env and set ADMIN_USER / ADMIN_PASS
docker compose up -d --build
```

Apply migrations and seed sample data inside the running app container:

```bash
docker compose exec app npx prisma migrate deploy
docker compose exec app npx prisma db seed
```

Open http://localhost (Caddy proxies to the app). Admin: http://localhost/admin

For a real VPS domain, change `localhost` in `Caddyfile` to your hostname so Caddy can issue HTTPS certificates.

## Local development (without Docker for the app)

1. Start Postgres (or use `docker compose up -d db`).
2. Set `DATABASE_URL` to your local Postgres URL in `.env`.
3. `npm install`
4. `npx prisma migrate dev`
5. `npx prisma db seed`
6. `npm run dev`
