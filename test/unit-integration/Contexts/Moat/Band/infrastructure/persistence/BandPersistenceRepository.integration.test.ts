import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import container from '@Test/apps/mybandnow/backend/config/dependency-injection/index.js';
import { BandPersistenceRepository } from '@Contexts/Moat/Band/domain/repository/BandPersistenceRepository.js';
import { EnvironmentArranger } from '@Test/utils/arranger/EnvironmentArranger.js';
import { BandMother } from '../../domain/BandMother.js';
import { BandPersistenceRepositoryTestCase } from './BandPersistenceRepositoryTestCase.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Filters } from '@Contexts/Shared/domain/criteria/Filters.js';
import { Filter } from '@Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '@Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator } from '@Contexts/Shared/domain/criteria/FilterOperator.js';
import { FilterValue } from '@Contexts/Shared/domain/criteria/FilterValue.js';
import { Order } from '@Contexts/Shared/domain/criteria/Order.js';

const persistenceRepository: BandPersistenceRepository = container.get('Moat.Band.BandRepository');
const prismaEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.PrismaEnvironmentArranger');
const testCase = new BandPersistenceRepositoryTestCase();

describe('BandPersistenceRepository', () => {
  beforeEach(async () => {
    await (await prismaEnvironmentArranger).arrange();
  });

  afterAll(async () => {
    await (await prismaEnvironmentArranger).clean();
    await (await prismaEnvironmentArranger).close();
  });

  async function createDependencies(bandId: string, ownerId: string) {
    const { PrismaClientFactory } =
      await import('@Contexts/Shared/infrastructure/persistence/prisma/PrismaClientFactory.js');
    const prisma = PrismaClientFactory.createClient();

    await prisma.user.create({
      data: {
        id: ownerId,
        email: `${ownerId}@test.com`,
        password: 'password'
      }
    });

    await prisma.musician.create({
      data: {
        id: ownerId,
        userId: ownerId,
        realName: 'Test Musician',
        username: `user_${ownerId.replace(/-/g, '').substring(0, 10)}`
      }
    });
  }

  describe('#search', () => {
    it('should return an existing band by id', async () => {
      const expectedModel = BandMother.create();
      await createDependencies(expectedModel.id.value, expectedModel.ownerId.value);
      await persistenceRepository.save(expectedModel);

      const model = await persistenceRepository.search(expectedModel.id);
      testCase.assertSimilar(model, expectedModel);
    });

    it('should not return a non-existing band by id', async () => {
      const model = BandMother.create();
      const found = await persistenceRepository.search(model.id);
      expect(found).toBeFalsy();
    });
  });

  describe('#save', () => {
    it('should save a band', async () => {
      const model = BandMother.random();
      await createDependencies(model.id.value, model.ownerId.value);
      await persistenceRepository.save(model);
      const found = await persistenceRepository.search(model.id);
      expect(found).not.toBeNull();
    });
  });

  describe('#matching', () => {
    it('should return an existing band by criteria', async () => {
      const expectedModel = BandMother.create();
      await createDependencies(expectedModel.id.value, expectedModel.ownerId.value);
      await persistenceRepository.save(expectedModel);

      const filters = new Filters([
        new Filter(new FilterField('_id'), FilterOperator.equal(), new FilterValue(expectedModel.id.value))
      ]);
      const criteria = new Criteria(filters, Order.none());

      const models = await persistenceRepository.matching(criteria);
      testCase.assertSimilar(models[0], expectedModel);
    });
  });

  describe('#remove', () => {
    it('should remove an existing band by id', async () => {
      const model = BandMother.create();
      await createDependencies(model.id.value, model.ownerId.value);
      await persistenceRepository.save(model);
      await persistenceRepository.remove(model);
      const found = await persistenceRepository.search(model.id);
      expect(found).toBeNull();
    });
  });
});
