/*
  Warnings:

  - You are about to drop the column `from` on the `comments` table. All the data in the column will be lost.
  - The primary key for the `notesUsers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `notesUsers` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userid` to the `Notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userid` to the `comments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notes" ADD COLUMN     "userid" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "from",
ADD COLUMN     "userid" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "notesUsers" DROP CONSTRAINT "notesUsers_pkey",
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "notesUsers_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "notesUsers_id_key" ON "notesUsers"("id");

-- AddForeignKey
ALTER TABLE "Notes" ADD CONSTRAINT "Notes_userid_fkey" FOREIGN KEY ("userid") REFERENCES "notesUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_userid_fkey" FOREIGN KEY ("userid") REFERENCES "notesUsers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
