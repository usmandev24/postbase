-- DropForeignKey
ALTER TABLE "Notes" DROP CONSTRAINT "Notes_autherId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_autherId_fkey";

-- DropForeignKey
ALTER TABLE "comments" DROP CONSTRAINT "comments_noteNotekey_fkey";

-- AddForeignKey
ALTER TABLE "Notes" ADD CONSTRAINT "Notes_autherId_fkey" FOREIGN KEY ("autherId") REFERENCES "notesUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_autherId_fkey" FOREIGN KEY ("autherId") REFERENCES "notesUsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_noteNotekey_fkey" FOREIGN KEY ("noteNotekey") REFERENCES "Notes"("key") ON DELETE CASCADE ON UPDATE CASCADE;
