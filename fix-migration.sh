#!/bin/bash
# Script to fix the migration issue for fresh databases

echo "Connecting to Fly app to mark migration as applied..."
fly ssh console -a share-stuff -C "prisma migrate resolve --applied 20251024135333_remove_community_items_relationship"

if [ $? -eq 0 ]; then
  echo "✓ Migration marked as applied successfully"
  echo "Now deploy again with: fly deploy -a share-stuff"
else
  echo "✗ Failed to mark migration as applied"
  echo "Try running manually:"
  echo "  fly ssh console -a share-stuff"
  echo "  prisma migrate resolve --applied 20251024135333_remove_community_items_relationship"
  echo "  exit"
fi
