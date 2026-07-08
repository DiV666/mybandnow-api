import { describe, it, beforeEach, afterAll } from 'vitest';
import container from '@Test/apps/mybandnow/backend/config/dependency-injection/index.js';
import { UserPersistenceRepository } from '@Contexts/Mybandnow/User/domain/repository/UserPersistenceRepository.js';
import { EnvironmentArranger } from '@Test/utils/arranger/EnvironmentArranger.js';
import { UserMother } from '../../domain/UserMother.js';
import { UserPersistenceRepositoryTestCase } from './UserPersistenceRepositoryTestCase.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Filters } from '@Contexts/Shared/domain/criteria/Filters.js';
import { Filter } from '@Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '@Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator } from '@Contexts/Shared/domain/criteria/FilterOperator.js';
import { FilterValue } from '@Contexts/Shared/domain/criteria/FilterValue.js';
import { Order } from '@Contexts/Shared/domain/criteria/Order.js';

const persistenceRepository: UserPersistenceRepository = container.get('Mybandnow.User.UserMongoRepository');
const mongoEnvironmentArranger: Promise<EnvironmentArranger> = container.get('Shared.MongoEnvironmentArranger');
const testCase = new UserPersistenceRepositoryTestCase();

describe('UserPersistenceRepository', () => {
  beforeEach(async () => {
    await (await mongoEnvironmentArranger).arrange();
  });

  afterAll(async () => {
    await (await mongoEnvironmentArranger).clean();
    await (await mongoEnvironmentArranger).close();
  });
  describe('#matching', () => {
    it('should return an existing user by criteria', async () => {
      const expectedModel = UserMother.create();
      await persistenceRepository.save(expectedModel);

      const filters = new Filters([
        new Filter(new FilterField('_id'), FilterOperator.equal(), new FilterValue(expectedModel.id.value))
      ]);
      const criteria = new Criteria(filters, Order.none());

      const models = await persistenceRepository.matching(criteria);
      testCase.assertSimilar(models[0], expectedModel);
    });
    // Los nuevos tests de filtrado se añadirán aquí
  });
  describe('#create', () => {
    // eslint-disable-next-line sonarjs/assertions-in-tests
    it('should save a user', async () => {
      const model = UserMother.random();
      await persistenceRepository.save(model);
    });
  });
});
