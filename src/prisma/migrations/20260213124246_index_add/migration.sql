-- CreateIndex
CREATE INDEX "comments_postkey_createdAt_idx" ON "comments"("postkey", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "comments_autherId_idx" ON "comments"("autherId");

-- CreateIndex
CREATE INDEX "like_userId_idx" ON "like"("userId");

-- CreateIndex
CREATE INDEX "posts_autherId_idx" ON "posts"("autherId");

-- CreateIndex
CREATE INDEX "posts_updatedAt_key_idx" ON "posts"("updatedAt" DESC, "key");
