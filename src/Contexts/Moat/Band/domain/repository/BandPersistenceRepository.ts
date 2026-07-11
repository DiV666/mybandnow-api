import { Band } from '../Band.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { BandId } from '../value-object/BandId.js';

import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';

export interface BandPersistenceRepository {
  search(id: BandId): Promise<Nullable<Band>>;

  save(model: Band): Promise<void>;
  matching(criteria: Criteria): Promise<Array<Band>>;

  matchingCount(criteria: Criteria): Promise<number>;
  remove(model: Band): Promise<void>;
}
