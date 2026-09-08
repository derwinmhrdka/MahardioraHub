#!/bin/sh
set -e
mkdir -p /app/uploads
chown -R nextjs:nodejs /app/uploads
exec su-exec nextjs node server.js
