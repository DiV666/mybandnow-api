DROP INDEX IF EXISTS "VideoclipProcess_songId_key";

CREATE INDEX "VideoclipProcess_songId_idx" ON "VideoclipProcess"("songId");

CREATE INDEX "VideoclipProcess_songId_status_idx" ON "VideoclipProcess"("songId", "status");
