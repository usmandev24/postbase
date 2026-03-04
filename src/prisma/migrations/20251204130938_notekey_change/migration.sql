/*
  Warnings:

  - The primary key for the `Notes` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `key` on the `Notes` table. All the data in the column will be lost.
  - Added the required column `notekey` to the `Notes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Notes" DROP CONSTRAINT "Notes_pkey",
DROP COLUMN "key",
ADD COLUMN     "notekey" VARCHAR(255) NOT NULL,
ADD CONSTRAINT "Notes_pkey" PRIMARY KEY ("notekey");
