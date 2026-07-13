ALTER TABLE "Track" RENAME TO "SongInstrumentUpload";

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Track_pkey') THEN
        ALTER TABLE "SongInstrumentUpload" RENAME CONSTRAINT "Track_pkey" TO "SongInstrumentUpload_pkey";
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Track_songId_fkey') THEN
        ALTER TABLE "SongInstrumentUpload" RENAME CONSTRAINT "Track_songId_fkey" TO "SongInstrumentUpload_songId_fkey";
    END IF;

    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Track_songInstrumentId_fkey') THEN
        ALTER TABLE "SongInstrumentUpload" RENAME CONSTRAINT "Track_songInstrumentId_fkey" TO "SongInstrumentUpload_songInstrumentId_fkey";
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'Track_songInstrumentId_key') THEN
        ALTER INDEX "Track_songInstrumentId_key" RENAME TO "SongInstrumentUpload_songInstrumentId_key";
    END IF;
END $$;
