# MahardioraHub (DealHub)

Affiliate deal aggregator + personal secondhand marketplace. Next.js (App Router), PostgreSQL, Prisma, Docker Compose. On VPS, host nginx handles HTTPS (app binds `127.0.0.1:13000` so it does not use ports 3000/3001).

## Auto deploy (GitHub Actions)

Pushes to `main` deploy to your VPS via SSH (same pattern as `airafin-dashboard`).

### One-time VPS setup

```bash
sudo mkdir -p /apps
sudo chown $USER:$USER /apps
git clone https://github.com/derwinmhrdka/MahardioraHub.git /apps/MahardioraHub
cd /apps/MahardioraHub
cp .env.example .env
# Edit .env: ADMIN_USER, ADMIN_PASS, DOMAIN, APP_HOST_PORT (default 13000)
docker compose up -d --build
docker compose run --rm migrate npx prisma db seed   # first time only
```

Point DNS at the VPS, then install host nginx + SSL:

```bash
sudo cp deploy/nginx-mahardiorahub.conf.example /etc/nginx/sites-available/mahardiorahub
# Edit proxy_pass only if APP_HOST_PORT ≠ 13000
sudo ln -s /etc/nginx/sites-available/mahardiorahub /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d mahardiora-hub.teknodika.com
```

Ensure the deploy user can run Docker without `sudo` (in the `docker` group), and can `git pull` in `/apps/MahardioraHub`.

### GitHub repository secrets

| Secret | Example | Required |
|--------|---------|----------|
| `VPS_HOST` | `43.134.92.145` | Yes |
| `VPS_USER` | `ubuntu` | Yes |
| `VPS_SSH_KEY` | Private key (PEM) | Yes |
| `VPS_PORT` | `22` | No |
| `VPS_APP_DIR` | `/apps/MahardioraHub` | No (default shown) |

`.env` stays on the server only — it is not overwritten by deploy.

Manual deploy on the VPS:

```bash
cd /apps/MahardioraHub
bash deploy/git-sync.sh
bash deploy/docker-deploy.sh
```

## Environment variables

Secrets and deploy-time config only (see `.env.example`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Compose sets this to the `db` service) |
| `ADMIN_USER` | Admin login username (Compose default: `admin`) |
| `ADMIN_PASS` | Admin login password (Compose default: `changeme`) |
| `APP_HOST_PORT` | Host port for the app (`127.0.0.1:PORT`, default `13000`) |
| `DOMAIN` | Public hostname (optional; deploy script HTTPS check) |
| `NODE_ENV` | `production` in Docker |

Set `ADMIN_USER` / `ADMIN_PASS` in a local `.env` next to `docker-compose.yml`. WhatsApp number, site name, and contact email live in the `Setting` table and are edited at `/admin/settings` — not via env vars.

## Run with Docker

```bash
cp .env.example .env
# set ADMIN_USER / ADMIN_PASS
docker compose up -d --build
docker compose run --rm migrate npx prisma db seed   # first time only
```

App is on http://127.0.0.1:13000 (change with `APP_HOST_PORT`). Migrations run via the `migrate` service on compose up. On a VPS, put nginx in front — see `deploy/nginx-mahardiorahub.conf.example`.

## Local development (without Docker for the app)

1. Start Postgres (or use `docker compose up -d db`).
2. Set `DATABASE_URL` to your local Postgres URL in `.env`.
3. `npm install`
4. `npx prisma migrate dev`
5. `npx prisma db seed`
6. `npm run dev`
