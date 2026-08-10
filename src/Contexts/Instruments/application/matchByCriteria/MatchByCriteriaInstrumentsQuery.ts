import { Query } from '@Contexts/Shared/domain/Query.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';

export class MatchByCriteriaInstrumentsQuery implements Query {
  constructor(readonly criteria: Criteria) {}
}
