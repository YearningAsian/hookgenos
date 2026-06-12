-- AddUniqueConstraint: trending_hooks(text, platform)
CREATE UNIQUE INDEX IF NOT EXISTS "trending_hooks_text_platform_key" ON "trending_hooks"("text", "platform");
