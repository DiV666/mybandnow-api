import { Musician } from '../Musician.js';
import { Criteria } from '../../../../Shared/domain/criteria/Criteria.js';

export interface MusicianPersistenceRepository {
  matching(criteria: Criteria): Promise<Array<Musician>>;

  matchingCount(criteria: Criteria): Promise<number>;

  save(model: Musician): Promise<void>;
}
