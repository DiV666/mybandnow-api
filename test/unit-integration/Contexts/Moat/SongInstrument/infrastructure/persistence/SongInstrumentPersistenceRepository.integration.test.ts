import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import container from '@Test/apps/mybandnow/backend/config/dependency-injection/index.js';
import { SongInstrumentPersistenceRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { EnvironmentArranger } from '@Test/utils/arranger/EnvironmentArranger.js';
import { SongInstrumentMother } from '../../domain/SongInstrumentMother.js';
import { SongInstrumentPersistenceRepositoryTestCase } from './SongInstrumentPersistenceRepositoryTestCase.js';

const persistenceRepository: SongInstrumentPersistenceRepository = container.get(
  'Moat.SongInstrument.SongInstrumentRepository'
);
const prismaEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.PrismaEnvironmentArranger');
const testCase = new SongInstrumentPersistenceRepositoryTestCase();

describe('SongInstrumentPersistenceRepository', () => {
  beforeEach(async () => {
    await (await prismaEnvironmentArranger).arrange();
  });

  afterAll(async () => {
    await (await prismaEnvironmentArranger).clean();
    await (await prismaEnvironmentArranger).close();
  });

  async function createDependencies(songId: string, musicianId: string) {
    const { PrismaClientFactory } =
      await import('@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js');
    const prisma = PrismaClientFactory.createClient();

    await prisma.user.create({
      data: {
        id: musicianId,
        email: `${musicianId}@test.com`,
        password: 'password'
      }
    });

    await prisma.musician.create({
      data: {
        id: musicianId,
        userId: musicianId,
        username: `songinstrument_${musicianId.replace(/-/g, '').substring(0, 12)}`,
        realName: 'Song Instrument Musician',
        instruments: []
      }
    });

    const bandId = `band-${songId}`;

    await prisma.band.create({
      data: {
        id: bandId,
        name: 'Song Instrument Band',
        ownerId: musicianId
      }
    });

    await prisma.song.create({
      data: {
        id: songId,
        title: 'Song Instrument Song',
        bandId,
        originalVideoclipUrl: `https://cdn.example.com/songs/${songId}/original.mp4`
      }
    });
  }

  describe('#search', () => {
    it('should return an existing songinstrument by id', async () => {
      const expectedModel = SongInstrumentMother.create();
      await createDependencies(expectedModel.songId.value, expectedModel.musicianId.value);
      await persistenceRepository.save(expectedModel);

      const model = await persistenceRepository.search(expectedModel.id);
      testCase.assertSimilar(model, expectedModel);
    });

    it('should not return a non-existing songinstrument by id', async () => {
      const model = SongInstrumentMother.create();
      const found = await persistenceRepository.search(model.id);
      expect(found).toBeFalsy();
    });
  });
  describe('#create', () => {
    it('should save a songinstrument', async () => {
      const model = SongInstrumentMother.random();
      await createDependencies(model.songId.value, model.musicianId.value);
      await persistenceRepository.save(model);
      const found = await persistenceRepository.search(model.id);
      expect(found).not.toBeNull();
    });
  });
});
