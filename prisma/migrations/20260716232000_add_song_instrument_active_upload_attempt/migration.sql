ALTER TABLE "SongInstrument"
    ADD COLUMN IF NOT EXISTS "activeUploadAttemptId" TEXT;

ALTER TABLE "SongInstrumentUpload"
    DROP CONSTRAINT IF EXISTS "SongInstrumentUpload_songInstrumentId_key";

CREATE INDEX IF NOT EXISTS "SongInstrumentUpload_songInstrumentId_idx"
    ON "SongInstrumentUpload"("songInstrumentId");

UPDATE "SongInstrument" si
SET "activeUploadAttemptId" = siu."id"
FROM "SongInstrumentUpload" siu
WHERE siu."songInstrumentId" = si."id"
  AND si."activeUploadAttemptId" IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "SongInstrument_activeUploadAttemptId_key"
    ON "SongInstrument"("activeUploadAttemptId");

ALTER TABLE "SongInstrument"
    DROP CONSTRAINT IF EXISTS "SongInstrument_activeUploadAttemptId_fkey",
    ADD CONSTRAINT "SongInstrument_activeUploadAttemptId_fkey"
        FOREIGN KEY ("activeUploadAttemptId") REFERENCES "SongInstrumentUpload"("id")
        ON DELETE SET NULL
        ON UPDATE CASCADE;
