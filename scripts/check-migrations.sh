#!/bin/sh
# Script to check and run migrations if needed

echo "Checking database migration status..."
npx prisma migrate status

if [ $? -ne 0 ]; then
  echo "Migrations are pending. Running migrations..."
  npx prisma migrate deploy
  if [ $? -eq 0 ]; then
    echo "Migrations completed successfully!"
  else
    echo "Migration failed! Check the error above."
    exit 1
  fi
else
  echo "Database is up to date."
fi
