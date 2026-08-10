import { Query } from '@Contexts/Shared/domain/Query.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';

export class MatchByCriteriaSongQuery implements Query {
  constructor(
    readonly musicianId: string,
    readonly criteria: Criteria
  ) {}
}
