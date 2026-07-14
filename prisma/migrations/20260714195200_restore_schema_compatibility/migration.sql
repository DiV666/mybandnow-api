ALTER TABLE "User"
    ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "Song"
    ADD COLUMN IF NOT EXISTS "originalVideoclipUrl" TEXT NOT NULL DEFAULT '';

ALTER TABLE "Song"
    ALTER COLUMN "originalVideoclipUrl" DROP DEFAULT;

CREATE TABLE IF NOT EXISTS "Outbox" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventName" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "occurredOn" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),
    "errorMessage" TEXT,

    CONSTRAINT "Outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Outbox_status_createdAt_idx" ON "Outbox"("status", "createdAt");
