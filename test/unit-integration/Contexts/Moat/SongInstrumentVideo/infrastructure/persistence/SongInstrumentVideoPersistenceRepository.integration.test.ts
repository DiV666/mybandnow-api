import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import container from '@Test/apps/mybandnow/backend/config/dependency-injection/index.js';
import { SongInstrumentVideoPersistenceRepository } from '@Contexts/Moat/SongInstrumentVideo/domain/repository/SongInstrumentVideoPersistenceRepository.js';
import { EnvironmentArranger } from '@Test/utils/arranger/EnvironmentArranger.js';
import { SongInstrumentVideoMother } from '../../domain/SongInstrumentVideoMother.js';
import { SongInstrumentVideoPersistenceRepositoryTestCase } from './SongInstrumentVideoPersistenceRepositoryTestCase.js';
import { PrismaClientFactory } from '@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js';

const persistenceRepository: SongInstrumentVideoPersistenceRepository = container.get(
  'Moat.SongInstrumentVideo.SongInstrumentVideoRepository'
);
const prismaEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.PrismaEnvironmentArranger');
const testCase = new SongInstrumentVideoPersistenceRepositoryTestCase();
const prisma = PrismaClientFactory.createClient();

async function ensureSongInstrumentVideoTable(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "SongInstrumentVideo" (
      "id" TEXT NOT NULL,
      "songInstrumentId" TEXT NOT NULL,
      "url" TEXT NOT NULL,
      "duration" INTEGER NOT NULL,
      "size" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SongInstrumentVideo_pkey" PRIMARY KEY ("id"),
      CONSTRAINT "SongInstrumentVideo_songInstrumentId_fkey"
        FOREIGN KEY ("songInstrumentId") REFERENCES "SongInstrument"("id") ON DELETE CASCADE ON UPDATE CASCADE
    );
  `);

  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "SongInstrumentVideo_songInstrumentId_key" ON "SongInstrumentVideo"("songInstrumentId")'
  );
}

async function createDependencies(songInstrumentId: string) {
  const userId = songInstrumentId;
  const musicianId = songInstrumentId;
  const songId = `song-${songInstrumentId}`;
  const bandId = `band-${songId}`;

  await prisma.user.create({
    data: {
      id: userId,
      email: `${userId}@test.com`,
      password: 'password'
    }
  });

  await prisma.musician.create({
    data: {
      id: musicianId,
      userId,
      username: `songinstrumentvideo_${songInstrumentId.replace(/-/g, '').substring(0, 8)}`,
      realName: 'Song Instrument Video Musician',
      instruments: []
    }
  });

  await prisma.band.create({
    data: {
      id: bandId,
      name: 'Song Instrument Video Band',
      ownerId: musicianId
    }
  });

  await prisma.song.create({
    data: {
      id: songId,
      title: 'Song Instrument Video Song',
      bandId
    }
  });

  await prisma.songInstrument.create({
    data: {
      id: songInstrumentId,
      name: 'Lead Guitar',
      instrumentType: 'guitar',
      songId,
      musicianId
    }
  });
}

describe('SongInstrumentVideoPersistenceRepository', () => {
  beforeEach(async () => {
    await ensureSongInstrumentVideoTable();
    await (await prismaEnvironmentArranger).arrange();
  });

  afterAll(async () => {
    await (await prismaEnvironmentArranger).clean();
    await (await prismaEnvironmentArranger).close();
  });

  describe('#search', () => {
    it('should return an existing songinstrumentvideo by id', async () => {
      const expectedModel = SongInstrumentVideoMother.create();
      await createDependencies(expectedModel.songInstrumentId.value);
      await persistenceRepository.save(expectedModel);

      const model = await persistenceRepository.search(expectedModel.id);
      testCase.assertSimilar(model, expectedModel);
    });

    it('should not return a non-existing songinstrumentvideo by id', async () => {
      const model = SongInstrumentVideoMother.create();
      const found = await persistenceRepository.search(model.id);
      expect(found).toBeFalsy();
    });
  });
  describe('#create', () => {
    it('should save a songinstrumentvideo', async () => {
      const model = SongInstrumentVideoMother.random();
      await createDependencies(model.songInstrumentId.value);
      await persistenceRepository.save(model);

      const found = await persistenceRepository.search(model.id);
      expect(found).not.toBeNull();
    });
  });
});
