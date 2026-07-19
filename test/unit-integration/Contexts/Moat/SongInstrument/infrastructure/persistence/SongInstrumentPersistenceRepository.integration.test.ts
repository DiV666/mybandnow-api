import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import container from '@Test/apps/mybandnow/backend/config/dependency-injection/index.js';
import { SongInstrumentPersistenceRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { EnvironmentArranger } from '@Test/utils/arranger/EnvironmentArranger.js';
import { SongInstrumentMother } from '../../domain/SongInstrumentMother.js';
import { SongInstrumentPersistenceRepositoryTestCase } from './SongInstrumentPersistenceRepositoryTestCase.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Filters } from '@Contexts/Shared/domain/criteria/Filters.js';
import { Filter } from '@Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '@Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator } from '@Contexts/Shared/domain/criteria/FilterOperator.js';
import { FilterValue } from '@Contexts/Shared/domain/criteria/FilterValue.js';
import { Order } from '@Contexts/Shared/domain/criteria/Order.js';
import { SongInstrumentInstrumentId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentInstrumentId.js';
import { SongInstrumentMusicianId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentMusicianId.js';
import { SongInstrumentSongId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentSongId.js';

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

  async function createDependencies(
    songId: string,
    musicianId: string,
    instrumentId = '0e7a0d5f-3d2a-4bc1-8d4d-100000000001'
  ) {
    const { PrismaClientFactory } =
      await import('@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js');
    const prisma = PrismaClientFactory.createClient();

    await prisma.user.upsert({
      where: { id: musicianId },
      update: {
        email: `${musicianId}@test.com`,
        password: 'password'
      },
      create: {
        id: musicianId,
        email: `${musicianId}@test.com`,
        password: 'password'
      }
    });

    await prisma.musician.upsert({
      where: { id: musicianId },
      update: {
        userId: musicianId,
        username: `songinstrument_${musicianId.replace(/-/g, '').substring(0, 12)}`,
        realName: 'Song Instrument Musician',
        instruments: []
      },
      create: {
        id: musicianId,
        userId: musicianId,
        username: `songinstrument_${musicianId.replace(/-/g, '').substring(0, 12)}`,
        realName: 'Song Instrument Musician',
        instruments: []
      }
    });

    await prisma.instruments.upsert({
      where: { id: instrumentId },
      update: {
        name: `Instrument ${instrumentId.slice(-4)}`,
        description: 'Song instrument dependency for tests'
      },
      create: {
        id: instrumentId,
        name: `Instrument ${instrumentId.slice(-4)}`,
        description: 'Song instrument dependency for tests'
      }
    });

    const bandId = `band-${songId}`;

    await prisma.band.upsert({
      where: { id: bandId },
      update: {
        name: 'Song Instrument Band',
        ownerId: musicianId
      },
      create: {
        id: bandId,
        name: 'Song Instrument Band',
        ownerId: musicianId
      }
    });

    await prisma.song.upsert({
      where: { id: songId },
      update: {
        title: 'Song Instrument Song',
        bandId,
        originalVideoclipUrl: `https://cdn.example.com/songs/${songId}/original.mp4`
      },
      create: {
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
      await createDependencies(
        expectedModel.songId.value,
        expectedModel.musicianId.value,
        expectedModel.instrumentId.value
      );
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
      await createDependencies(model.songId.value, model.musicianId.value, model.instrumentId.value);
      await persistenceRepository.save(model);
      const found = await persistenceRepository.search(model.id);
      expect(found).not.toBeNull();
    });

    it('should throw a safe invalid argument exception when the instrument relation does not exist', async () => {
      const model = SongInstrumentMother.create({
        instrumentId: new SongInstrumentInstrumentId('0e7a0d5f-3d2a-4bc1-8d4d-199999999999')
      });
      await createDependencies(model.songId.value, model.musicianId.value);

      await expect(persistenceRepository.save(model)).rejects.toMatchObject({
        code: 'SONG_INSTRUMENT_RELATION_NOT_FOUND',
        message: expect.stringContaining(model.toPrimitives().instrumentId)
      });
    });
  });

  describe('#matching', () => {
    it('should return an existing songinstrument by criteria', async () => {
      const expectedModel = SongInstrumentMother.create();
      await createDependencies(
        expectedModel.songId.value,
        expectedModel.musicianId.value,
        expectedModel.instrumentId.value
      );
      await persistenceRepository.save(expectedModel);

      const filters = new Filters([
        new Filter(new FilterField('_id'), FilterOperator.equal(), new FilterValue(expectedModel.id.value))
      ]);
      const criteria = new Criteria(filters, Order.none());

      const models = await persistenceRepository.matching(criteria);
      testCase.assertSimilar(models[0], expectedModel);
    });

    it('should count songinstruments by criteria', async () => {
      const songId = '5ff847a3-d345-4cb1-8fc0-1f5545285a19';
      const musicianId = '4fd5813f-9b71-49fb-882f-435f3e2b8dc4';
      const firstInstrumentId = '0e7a0d5f-3d2a-4bc1-8d4d-100000000001';
      const secondInstrumentId = '0e7a0d5f-3d2a-4bc1-8d4d-100000000002';
      const firstModel = SongInstrumentMother.create({
        songId: new SongInstrumentSongId(songId),
        musicianId: new SongInstrumentMusicianId(musicianId),
        instrumentId: new SongInstrumentInstrumentId(firstInstrumentId)
      });
      const secondModel = SongInstrumentMother.create({
        songId: new SongInstrumentSongId(songId),
        musicianId: new SongInstrumentMusicianId(musicianId),
        instrumentId: new SongInstrumentInstrumentId(firstInstrumentId)
      });
      const thirdModel = SongInstrumentMother.create({
        songId: new SongInstrumentSongId(songId),
        musicianId: new SongInstrumentMusicianId(musicianId),
        instrumentId: new SongInstrumentInstrumentId(secondInstrumentId)
      });

      await createDependencies(songId, musicianId, firstInstrumentId);
      await createDependencies(songId, musicianId, secondInstrumentId);
      await persistenceRepository.save(firstModel);
      await persistenceRepository.save(secondModel);
      await persistenceRepository.save(thirdModel);

      const filters = new Filters([
        new Filter(new FilterField('songId'), FilterOperator.equal(), new FilterValue(songId)),
        new Filter(new FilterField('instrumentId'), FilterOperator.equal(), new FilterValue(firstInstrumentId))
      ]);
      const criteria = new Criteria(filters, Order.none());

      const total = await persistenceRepository.matchingCount(criteria);

      expect(total).toBe(2);
    });
  });
});
