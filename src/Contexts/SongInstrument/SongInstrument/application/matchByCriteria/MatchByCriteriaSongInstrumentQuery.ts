import { Query } from '@Contexts/Shared/domain/Query.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';

export class MatchByCriteriaSongInstrumentQuery implements Query {
  constructor(
    readonly songId: string,
    readonly musicianId: string,
    readonly criteria: Criteria
  ) {}
}
