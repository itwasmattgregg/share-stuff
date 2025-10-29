-- DropForeignKey
DROP INDEX "Item_communityId_fkey";

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "communityId";
