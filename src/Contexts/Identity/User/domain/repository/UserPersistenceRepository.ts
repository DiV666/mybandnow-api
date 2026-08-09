import { User } from '../User.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';

export interface UserPersistenceRepository {
  matching(criteria: Criteria): Promise<Array<User>>;

  matchingCount(criteria: Criteria): Promise<number>;

  existsById(id: string): Promise<boolean>;

  save(model: User): Promise<void>;
}
