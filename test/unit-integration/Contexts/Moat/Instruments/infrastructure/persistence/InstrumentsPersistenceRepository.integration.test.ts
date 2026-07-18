import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import container from '@Test/apps/mybandnow/backend/config/dependency-injection/index.js';
import { InstrumentsPersistenceRepository } from '@Contexts/Moat/Instruments/domain/repository/InstrumentsPersistenceRepository.js';
import { EnvironmentArranger } from '@Test/utils/arranger/EnvironmentArranger.js';
import { InstrumentsMother } from '../../domain/InstrumentsMother.js';
import { InstrumentsPersistenceRepositoryTestCase } from './InstrumentsPersistenceRepositoryTestCase.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Filters } from '@Contexts/Shared/domain/criteria/Filters.js';
import { Filter } from '@Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '@Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator } from '@Contexts/Shared/domain/criteria/FilterOperator.js';
import { FilterValue } from '@Contexts/Shared/domain/criteria/FilterValue.js';
import { Order } from '@Contexts/Shared/domain/criteria/Order.js';
import { InstrumentsId } from '@Contexts/Moat/Instruments/domain/value-object/InstrumentsId.js';

const persistenceRepository: InstrumentsPersistenceRepository = container.get('Moat.Instruments.InstrumentsRepository');
const prismaEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.PrismaEnvironmentArranger');
const testCase = new InstrumentsPersistenceRepositoryTestCase();

describe('InstrumentsPersistenceRepository', () => {
  beforeEach(async () => {
    await (await prismaEnvironmentArranger).arrange();
  });

  afterAll(async () => {
    await (await prismaEnvironmentArranger).clean();
    await (await prismaEnvironmentArranger).close();
  });

  describe('#search', () => {
    it('should return an existing instruments by id', async () => {
      const expectedModel = InstrumentsMother.create();
      await persistenceRepository.save(expectedModel);

      const model = await persistenceRepository.search(expectedModel.id);
      testCase.assertSimilar(model, expectedModel);
    });

    it('should not return a non-existing instruments by id', async () => {
      const found = await persistenceRepository.search(new InstrumentsId('53e88701-f222-4aef-bb9a-493de33475e7'));
      expect(found).toBeFalsy();
    });
  });

  describe('#matching', () => {
    it('should return an existing instruments by criteria', async () => {
      const expectedModel = InstrumentsMother.create();
      await persistenceRepository.save(expectedModel);

      const filters = new Filters([
        new Filter(new FilterField('_id'), FilterOperator.equal(), new FilterValue(expectedModel.id.value))
      ]);
      const criteria = new Criteria(filters, Order.none());

      const models = await persistenceRepository.matching(criteria);
      testCase.assertSimilar(models[0], expectedModel);
    });
  });

  describe('#create', () => {
    it('should save a instruments', async () => {
      const model = InstrumentsMother.random();
      await persistenceRepository.save(model);
      const found = await persistenceRepository.search(model.id);
      expect(found).not.toBeNull();
    });
  });
});
