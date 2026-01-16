#!/bin/sh -ex

# This file is how Fly starts the server (configured in fly.toml). 
# The release command in fly.toml handles database migrations.
# This script only starts the server.

# allocate swap space
fallocate -l 512M /swapfile
chmod 0600 /swapfile
mkswap /swapfile
echo 10 > /proc/sys/vm/swappiness
swapon /swapfile
echo 1 > /proc/sys/vm/overcommit_memory

# If arguments are passed, execute them (for release commands)
# Otherwise, start the Remix server
if [ $# -gt 0 ]; then
  exec "$@"
else
  # Start the Remix server
  npx remix-serve build/index.js
fi
