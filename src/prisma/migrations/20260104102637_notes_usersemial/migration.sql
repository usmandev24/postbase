/*
  Warnings:

  - You are about to drop the column `fullName` on the `notesUsers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "notesUsers" DROP COLUMN "fullName",
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "firstName" VARCHAR(255);
