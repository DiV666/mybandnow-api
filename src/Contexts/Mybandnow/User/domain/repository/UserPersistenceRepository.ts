import { User } from '../User.js';
import { Criteria } from '../../../../Shared/domain/criteria/Criteria.js';

export interface UserPersistenceRepository {
  matching(criteria: Criteria): Promise<Array<User>>;

  matchingCount(criteria: Criteria): Promise<number>;

  save(model: User): Promise<void>;
}
