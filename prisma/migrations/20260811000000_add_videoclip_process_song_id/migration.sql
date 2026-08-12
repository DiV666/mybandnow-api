ALTER TABLE "VideoclipProcess"
  ADD COLUMN "songId" TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "VideoclipProcess") THEN
    RAISE EXCEPTION
      'Cannot complete VideoclipProcess.songId migration: existing VideoclipProcess rows require manual backfill before enforcing the new relation.';
  END IF;
END $$;

ALTER TABLE "VideoclipProcess"
  ALTER COLUMN "songId" SET NOT NULL;

CREATE UNIQUE INDEX "VideoclipProcess_songId_key" ON "VideoclipProcess"("songId");

ALTER TABLE "VideoclipProcess"
  ADD CONSTRAINT "VideoclipProcess_songId_fkey"
  FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;
