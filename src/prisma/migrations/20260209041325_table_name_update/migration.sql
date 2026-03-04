/*
  Warnings:

  - You are about to drop the `post` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_postkey_fkey";

-- DropForeignKey
ALTER TABLE "post" DROP CONSTRAINT "post_autherId_fkey";

-- DropTable
DROP TABLE "post";

-- CreateTable
CREATE TABLE "posts" (
    "title" VARCHAR(255),
    "body" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "likes" INTEGER,
    "public" BOOLEAN NOT NULL DEFAULT true,
    "autherId" VARCHAR(255) NOT NULL,
    "key" VARCHAR(255) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("key")
);

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_autherId_fkey" FOREIGN KEY ("autherId") REFERENCES "postUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_postkey_fkey" FOREIGN KEY ("postkey") REFERENCES "posts"("key") ON DELETE CASCADE ON UPDATE CASCADE;
