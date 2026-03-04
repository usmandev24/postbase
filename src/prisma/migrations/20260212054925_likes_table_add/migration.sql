/*
  Warnings:

  - You are about to drop the column `likes` on the `posts` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "posts" DROP COLUMN "likes";

-- CreateTable
CREATE TABLE "like" (
    "postkey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "like_pkey" PRIMARY KEY ("postkey","userId")
);

-- AddForeignKey
ALTER TABLE "like" ADD CONSTRAINT "like_postkey_fkey" FOREIGN KEY ("postkey") REFERENCES "posts"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like" ADD CONSTRAINT "like_userId_fkey" FOREIGN KEY ("userId") REFERENCES "postUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
