/*
  Warnings:

  - You are about to drop the column `noteNotekey` on the `comments` table. All the data in the column will be lost.
  - You are about to drop the column `userid` on the `session` table. All the data in the column will be lost.
  - You are about to drop the `Notes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `notesUsers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `postkey` to the `comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `session` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Notes" DROP CONSTRAINT "Notes_autherId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_autherId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_noteNotekey_fkey";

-- DropForeignKey
ALTER TABLE "session" DROP CONSTRAINT "session_userid_fkey";

-- AlterTable
ALTER TABLE "comments" DROP COLUMN "noteNotekey",
ADD COLUMN     "postkey" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "session" DROP COLUMN "userid",
ADD COLUMN     "userId" TEXT NOT NULL;

-- DropTable
DROP TABLE "Notes";

-- DropTable
DROP TABLE "notesUsers";

-- CreateTable
CREATE TABLE "postUser" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "firstName" VARCHAR(255),
    "lastName" VARCHAR(255),
    "email" VARCHAR(255),
    "about" TEXT,
    "photo" BYTEA,
    "photoType" VARCHAR(255),
    "photo_updatedAt" TIMESTAMPTZ(6),

    CONSTRAINT "postUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post" (
    "title" VARCHAR(255),
    "body" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,
    "likes" INTEGER,
    "public" BOOLEAN NOT NULL DEFAULT true,
    "autherId" VARCHAR(255) NOT NULL,
    "key" VARCHAR(255) NOT NULL,

    CONSTRAINT "post_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "postUser_id_key" ON "postUser"("id");

-- CreateIndex
CREATE UNIQUE INDEX "postUser_username_key" ON "postUser"("username");

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_autherId_fkey" FOREIGN KEY ("autherId") REFERENCES "postUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_autherId_fkey" FOREIGN KEY ("autherId") REFERENCES "postUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_postkey_fkey" FOREIGN KEY ("postkey") REFERENCES "post"("key") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "postUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;
