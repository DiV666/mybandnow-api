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
import { SongInstrumentInstrumentType } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentInstrumentType.js';
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
  describe('#matching', () => {
    it('should return an existing songinstrument by criteria', async () => {
      const expectedModel = SongInstrumentMother.create();
      await createDependencies(expectedModel.songId.value, expectedModel.musicianId.value);
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
      const firstModel = SongInstrumentMother.create({
        songId: new SongInstrumentSongId(songId),
        musicianId: new SongInstrumentMusicianId(musicianId),
        instrumentType: new SongInstrumentInstrumentType('guitar')
      });
      const secondModel = SongInstrumentMother.create({
        songId: new SongInstrumentSongId(songId),
        musicianId: new SongInstrumentMusicianId(musicianId),
        instrumentType: new SongInstrumentInstrumentType('guitar')
      });
      const thirdModel = SongInstrumentMother.create({
        songId: new SongInstrumentSongId(songId),
        musicianId: new SongInstrumentMusicianId(musicianId),
        instrumentType: new SongInstrumentInstrumentType('bass')
      });

      await createDependencies(songId, musicianId);
      await persistenceRepository.save(firstModel);
      await persistenceRepository.save(secondModel);
      await persistenceRepository.save(thirdModel);

      const filters = new Filters([
        new Filter(new FilterField('songId'), FilterOperator.equal(), new FilterValue(songId)),
        new Filter(new FilterField('instrumentType'), FilterOperator.equal(), new FilterValue('guitar'))
      ]);
      const criteria = new Criteria(filters, Order.none());

      const total = await persistenceRepository.matchingCount(criteria);

      expect(total).toBe(2);
    });
  });
  describe('#create', () => {
    // eslint-disable-next-line sonarjs/assertions-in-tests
    it('should save a songinstrument', async () => {
      const model = SongInstrumentMother.random();
      await createDependencies(model.songId.value, model.musicianId.value);
      await persistenceRepository.save(model);
    });
  });
});
