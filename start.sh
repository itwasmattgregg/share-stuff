#!/bin/sh -ex

# Fly entrypoint. Migrations must run here (not only in release_command)
# because the SQLite volume is attached to the app Machine, not the
# ephemeral release Machine.

# Best-effort swap — never block listening on PORT if this fails.
(
  fallocate -l 512M /swapfile
  chmod 0600 /swapfile
  mkswap /swapfile
  echo 10 > /proc/sys/vm/swappiness
  swapon /swapfile
  echo 1 > /proc/sys/vm/overcommit_memory
) || echo "Warning: swap setup failed; continuing without swap"

# If arguments are passed, execute them (for release commands / one-offs)
if [ $# -gt 0 ]; then
  exec "$@"
fi

echo "Applying database migrations before starting server..."
npx prisma migrate deploy

# Bind explicitly for Fly's proxy (internal_port 8080)
export HOST="${HOST:-0.0.0.0}"
export PORT="${PORT:-8080}"

# exec so remix-serve is PID 1 and receives signals; avoid npx startup delay
exec ./node_modules/.bin/remix-serve ./build/index.js
