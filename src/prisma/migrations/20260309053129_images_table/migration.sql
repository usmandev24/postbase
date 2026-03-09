-- AlterTable
ALTER TABLE "postUser" ADD COLUMN     "photoURL" TEXT;

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "coverImage" TEXT;

-- CreateTable
CREATE TABLE "images" (
    "id" SERIAL NOT NULL,
    "blob" BYTEA NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "images_url_key" ON "images"("url");

-- CreateIndex
CREATE INDEX "images_url_idx" ON "images"("url");
