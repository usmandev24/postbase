/*
  Warnings:

  - The primary key for the `Notes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `notekey` on the `Notes` table. All the data in the column will be lost.
  - Added the required column `key` to the `Notes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_noteNotekey_fkey";

-- AlterTable
ALTER TABLE "Notes" DROP CONSTRAINT "Notes_pkey",
DROP COLUMN "notekey",
ADD COLUMN     "key" VARCHAR(255) NOT NULL,
ADD CONSTRAINT "Notes_pkey" PRIMARY KEY ("key");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_noteNotekey_fkey" FOREIGN KEY ("noteNotekey") REFERENCES "Notes"("key") ON DELETE RESTRICT ON UPDATE CASCADE;
