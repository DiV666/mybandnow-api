ALTER TABLE "SongInstrument"
  ADD COLUMN "instrumentId" TEXT;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "SongInstrument") THEN
    RAISE EXCEPTION
      'Cannot complete SongInstrument.instrumentId migration: existing SongInstrument rows require manual backfill to Instruments before enforcing the new relation.';
  END IF;
END $$;

ALTER TABLE "SongInstrument"
  ALTER COLUMN "instrumentType" DROP NOT NULL,
  ALTER COLUMN "instrumentId" SET NOT NULL;

ALTER TABLE "SongInstrument"
  ADD CONSTRAINT "SongInstrument_instrumentId_fkey"
  FOREIGN KEY ("instrumentId") REFERENCES "Instruments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

DROP INDEX IF EXISTS "SongInstrument_songId_instrumentType_idx";
CREATE INDEX "SongInstrument_songId_instrumentId_idx" ON "SongInstrument"("songId", "instrumentId");
