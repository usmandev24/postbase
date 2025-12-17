/*
  Warnings:

  - A unique constraint covering the columns `[autherId]` on the table `Notes` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[autherName]` on the table `Notes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `autherId` to the `Notes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `autherName` to the `Notes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notes" ADD COLUMN     "autherId" TEXT NOT NULL,
ADD COLUMN     "autherName" TEXT NOT NULL,
ADD COLUMN     "likes" INTEGER;

-- CreateTable
CREATE TABLE "comments" (
    "id" SERIAL NOT NULL,
    "from" VARCHAR(255) NOT NULL,
    "body" VARCHAR(1024) NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL,
    "noteNotekey" VARCHAR(255) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "comments_noteNotekey_key" ON "comments"("noteNotekey");

-- CreateIndex
CREATE UNIQUE INDEX "Notes_autherId_key" ON "Notes"("autherId");

-- CreateIndex
CREATE UNIQUE INDEX "Notes_autherName_key" ON "Notes"("autherName");

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_noteNotekey_fkey" FOREIGN KEY ("noteNotekey") REFERENCES "Notes"("notekey") ON DELETE RESTRICT ON UPDATE CASCADE;
