-- DropIndex
DROP INDEX "Notes_autherId_key";

-- DropIndex
DROP INDEX "Notes_autherName_key";

-- AlterTable
ALTER TABLE "Notes" ALTER COLUMN "autherName" DROP NOT NULL;
