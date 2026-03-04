/*
  Warnings:

  - You are about to drop the column `autherName` on the `Notes` table. All the data in the column will be lost.
  - You are about to drop the column `userid` on the `Notes` table. All the data in the column will be lost.
  - You are about to drop the column `userid` on the `comments` table. All the data in the column will be lost.
  - Added the required column `autherId` to the `Notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autherId` to the `comments` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Notes" DROP CONSTRAINT "Notes_userid_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_userid_fkey";

-- AlterTable
ALTER TABLE "Notes" DROP COLUMN "autherName",
DROP COLUMN "userid",
ADD COLUMN     "autherId" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "userid",
ADD COLUMN     "autherId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Notes" ADD CONSTRAINT "Notes_autherId_fkey" FOREIGN KEY ("autherId") REFERENCES "notesUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_autherId_fkey" FOREIGN KEY ("autherId") REFERENCES "notesUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
