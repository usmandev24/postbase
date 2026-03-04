-- CreateTable
CREATE TABLE "catagories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,

    CONSTRAINT "catagories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_catagoriesToposts" (
    "A" INTEGER NOT NULL,
    "B" VARCHAR(255) NOT NULL,

    CONSTRAINT "_catagoriesToposts_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "catagories_name_idx" ON "catagories"("name");

-- CreateIndex
CREATE INDEX "_catagoriesToposts_B_index" ON "_catagoriesToposts"("B");

-- AddForeignKey
ALTER TABLE "_catagoriesToposts" ADD CONSTRAINT "_catagoriesToposts_A_fkey" FOREIGN KEY ("A") REFERENCES "catagories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_catagoriesToposts" ADD CONSTRAINT "_catagoriesToposts_B_fkey" FOREIGN KEY ("B") REFERENCES "posts"("key") ON DELETE CASCADE ON UPDATE CASCADE;
