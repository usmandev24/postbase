/*
  Warnings:

  - The primary key for the `categoryToPosts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `catgId` on the `categoryToPosts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `catgName` to the `categoryToPosts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "categoryToPosts" DROP CONSTRAINT "categoryToPosts_catgId_fkey";

-- AlterTable
ALTER TABLE "categoryToPosts" DROP CONSTRAINT "categoryToPosts_pkey",
DROP COLUMN "catgId",
ADD COLUMN     "catgName" TEXT NOT NULL,
ADD CONSTRAINT "categoryToPosts_pkey" PRIMARY KEY ("catgName", "postkey");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- AddForeignKey
ALTER TABLE "categoryToPosts" ADD CONSTRAINT "categoryToPosts_catgName_fkey" FOREIGN KEY ("catgName") REFERENCES "categories"("name") ON DELETE CASCADE ON UPDATE CASCADE;
