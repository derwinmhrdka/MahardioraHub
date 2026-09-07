#!/usr/bin/env bash
set -euo pipefail

COMPOSE="${COMPOSE_CMD:-docker compose}"

if [ ! -f .env ]; then
  echo "ERROR: .env not found in $(pwd). Create it from .env.example before deploying." >&2
  exit 1
fi

# shellcheck disable=SC1091
set -a
source .env
set +a

APP_HOST_PORT="${APP_HOST_PORT:-13000}"
DOMAIN="${DOMAIN:-mahardiora-hub.teknodika.com}"

echo "==> Building and starting containers (db, app) on 127.0.0.1:${APP_HOST_PORT}..."
echo "    HTTPS is handled by host nginx — see deploy/nginx-mahardiorahub.conf.example"
$COMPOSE up -d --build --remove-orphans

echo "==> Waiting for database..."
for i in $(seq 1 30); do
  if $COMPOSE exec -T db pg_isready -U dealhub -d dealhub >/dev/null 2>&1; then
    echo "==> Database ready"
    break
  fi
  echo "Attempt $i: database not ready, waiting 2s..."
  sleep 2
done

if ! $COMPOSE exec -T db pg_isready -U dealhub -d dealhub >/dev/null 2>&1; then
  echo "ERROR: Database health check failed" >&2
  $COMPOSE logs db --tail 40
  exit 1
fi

echo "==> Applying Prisma migrations..."
$COMPOSE exec -T app node node_modules/prisma/build/index.js migrate deploy

echo "==> Container status:"
$COMPOSE ps

echo "==> Waiting for app on 127.0.0.1:${APP_HOST_PORT}..."
APP_READY=false
for i in $(seq 1 30); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${APP_HOST_PORT}/" 2>/dev/null; then
    echo "==> App OK on http://127.0.0.1:${APP_HOST_PORT}/"
    APP_READY=true
    break
  fi
  echo "Attempt $i: app not ready, waiting 3s..."
  sleep 3
done

if [ "$APP_READY" = false ]; then
  echo "ERROR: App not responding on http://127.0.0.1:${APP_HOST_PORT}/" >&2
  $COMPOSE logs app --tail 40
  exit 1
fi

if [ -n "$DOMAIN" ]; then
  echo "==> Checking public HTTPS..."
  if curl -fsS -o /dev/null "https://${DOMAIN}" 2>/dev/null; then
    echo "==> Deploy finished OK — https://${DOMAIN}"
  else
    echo "==> Containers OK. HTTPS not reachable yet at https://${DOMAIN}" >&2
    echo "    Configure host nginx: deploy/nginx-mahardiorahub.conf.example" >&2
    echo "    Then: sudo certbot --nginx -d ${DOMAIN}" >&2
  fi
else
  echo "==> Deploy finished OK (set DOMAIN in .env to verify public HTTPS)"
fi
