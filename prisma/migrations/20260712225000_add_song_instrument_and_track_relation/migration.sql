-- Introduce SongInstrument and formal Track.songInstrumentId relation.
-- Existing Track rows must be backfilled before this migration can finish if they
-- do not already expose a recoverable legacy song-instrument reference.

CREATE TABLE "SongInstrument" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "instrumentType" TEXT NOT NULL,
    "songId" TEXT NOT NULL,
    "musicianId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SongInstrument_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "SongInstrument"
    ADD CONSTRAINT "SongInstrument_songId_fkey"
    FOREIGN KEY ("songId") REFERENCES "Song"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SongInstrument"
    ADD CONSTRAINT "SongInstrument_musicianId_fkey"
    FOREIGN KEY ("musicianId") REFERENCES "Musician"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Track" ADD COLUMN "songInstrumentId" TEXT;

UPDATE "Track"
SET "songInstrumentId" = split_part("instrumentName", ':', 2)
WHERE "songInstrumentId" IS NULL
  AND "instrumentName" LIKE 'song-instrument:%';

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM "Track" WHERE "songInstrumentId" IS NULL) THEN
        RAISE EXCEPTION
            'Cannot complete Track.songInstrumentId migration: existing Track rows require manual backfill before enforcing the relation.';
    END IF;
END $$;

ALTER TABLE "Track"
    ALTER COLUMN "songInstrumentId" SET NOT NULL;

CREATE UNIQUE INDEX "Track_songInstrumentId_key" ON "Track"("songInstrumentId");

ALTER TABLE "Track"
    ADD CONSTRAINT "Track_songInstrumentId_fkey"
    FOREIGN KEY ("songInstrumentId") REFERENCES "SongInstrument"("id") ON DELETE CASCADE ON UPDATE CASCADE;
