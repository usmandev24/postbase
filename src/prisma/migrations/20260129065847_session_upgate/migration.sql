/*
  Warnings:

  - The primary key for the `session` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `sess` on the `session` table. All the data in the column will be lost.
  - You are about to drop the column `sid` on the `session` table. All the data in the column will be lost.
  - The required column `id` was added to the `session` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `userid` to the `session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "session" DROP CONSTRAINT "session_pkey",
DROP COLUMN "sess",
DROP COLUMN "sid",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "userid" TEXT NOT NULL,
ADD CONSTRAINT "session_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userid_fkey" FOREIGN KEY ("userid") REFERENCES "notesUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
