/*
  Warnings:

  - You are about to drop the column `autherId` on the `Notes` table. All the data in the column will be lost.
  - You are about to alter the column `autherName` on the `Notes` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - Made the column `autherName` on table `Notes` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "comments_noteNotekey_key";

-- AlterTable
ALTER TABLE "Notes" DROP COLUMN "autherId",
ADD COLUMN     "public" BOOLEAN NOT NULL DEFAULT true,
ALTER COLUMN "autherName" SET NOT NULL,
ALTER COLUMN "autherName" SET DATA TYPE VARCHAR(255);
