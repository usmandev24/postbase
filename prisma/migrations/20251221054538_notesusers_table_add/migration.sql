-- CreateTable
CREATE TABLE "notesUsers" (
    "id" INTEGER NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(255) NOT NULL,
    "displayName" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(255) NOT NULL,
    "photo" BYTEA NOT NULL,

    CONSTRAINT "notesUsers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notesUsers_username_key" ON "notesUsers"("username");
