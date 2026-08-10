import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { MatchByCriteriaBandQuery } from './MatchByCriteriaBandQuery.js';
import { BandMatcher } from './BandMatcher.js';
import { MatchByCriteriaBandResponse } from './MatchByCriteriaBandResponse.js';

export class MatchByCriteriaBandQueryHandler implements QueryHandler<
  MatchByCriteriaBandQuery,
  MatchByCriteriaBandResponse
> {
  constructor(private useCase: BandMatcher) {}

  subscribedTo(): Query {
    return MatchByCriteriaBandQuery;
  }

  async handle(query: MatchByCriteriaBandQuery): Promise<MatchByCriteriaBandResponse> {
    return this.useCase.run(query.authenticatedUser, query.criteria);
  }
}
