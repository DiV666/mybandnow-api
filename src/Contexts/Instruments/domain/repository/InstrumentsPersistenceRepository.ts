import { Instruments } from '../Instruments.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { InstrumentsId } from '../value-object/InstrumentsId.js';

export interface InstrumentsPersistenceRepository {
  search(id: InstrumentsId): Promise<Nullable<Instruments>>;

  matching(criteria: Criteria): Promise<Array<Instruments>>;

  matchingCount(criteria: Criteria): Promise<number>;

  save(model: Instruments): Promise<void>;
}
