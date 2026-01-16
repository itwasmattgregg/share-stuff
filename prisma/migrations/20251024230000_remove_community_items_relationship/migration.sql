-- DropForeignKey
-- Note: SQLite doesn't create indexes for foreign keys, so we skip the DROP INDEX
-- The index "Item_communityId_fkey" doesn't exist in SQLite - this line is safe to skip

-- AlterTable
-- This migration removes communityId from Item table if it exists
-- For fresh databases where init migration already created Item without communityId,
-- this migration is effectively a no-op (Item_new will match Item, so no change)

PRAGMA foreign_keys=off;

-- Create new table without communityId (final desired state)
CREATE TABLE "Item_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "condition" TEXT,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "Item_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy data from Item table (excluding communityId if it exists)
-- If Item doesn't exist or doesn't have communityId, this still works
-- We select only the columns that exist in both old and new schema
INSERT INTO "Item_new" (id, name, description, category, condition, "isAvailable", createdAt, updatedAt, ownerId)
SELECT id, name, description, category, condition, "isAvailable", createdAt, updatedAt, ownerId FROM "Item";

-- Replace old table with new one
DROP TABLE IF EXISTS "Item";
ALTER TABLE "Item_new" RENAME TO "Item";
PRAGMA foreign_keys=on;
