/*
  Warnings:

  - You are about to drop the `_catagoriesToposts` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `catagories` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "_catagoriesToposts" DROP CONSTRAINT "_catagoriesToposts_A_fkey";

-- DropForeignKey
ALTER TABLE "_catagoriesToposts" DROP CONSTRAINT "_catagoriesToposts_B_fkey";

-- DropTable
DROP TABLE "_catagoriesToposts";

-- DropTable
DROP TABLE "catagories";

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoryToPosts" (
    "postkey" TEXT NOT NULL,
    "catgId" INTEGER NOT NULL,

    CONSTRAINT "categoryToPosts_pkey" PRIMARY KEY ("catgId","postkey")
);

-- CreateIndex
CREATE INDEX "categoryToPosts_postkey_idx" ON "categoryToPosts"("postkey");

-- AddForeignKey
ALTER TABLE "categoryToPosts" ADD CONSTRAINT "categoryToPosts_postkey_fkey" FOREIGN KEY ("postkey") REFERENCES "posts"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoryToPosts" ADD CONSTRAINT "categoryToPosts_catgId_fkey" FOREIGN KEY ("catgId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
