#!/bin/sh
set -e
mkdir -p /app/uploads
chown -R nextjs:nodejs /app/uploads

# Background order expiry — hits local cron every 60s after boot.
# Prefer CRON_SECRET when set; otherwise localhost is allowed by the API.
(
  sleep 20
  while true; do
    if [ -n "${CRON_SECRET:-}" ]; then
      node -e "fetch('http://127.0.0.1:3000/api/cron/expire-orders',{headers:{authorization:'Bearer '+process.env.CRON_SECRET}}).catch(()=>{})" || true
    else
      node -e "fetch('http://127.0.0.1:3000/api/cron/expire-orders').catch(()=>{})" || true
    fi
    sleep 60
  done
) &

exec su-exec nextjs node server.js
