import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { MatchByCriteriaSongQuery } from './MatchByCriteriaSongQuery.js';
import { MatchByCriteriaSongResponse } from './MatchByCriteriaSongResponse.js';
import { SongMatcher } from './SongMatcher.js';

export class MatchByCriteriaSongQueryHandler implements QueryHandler<
  MatchByCriteriaSongQuery,
  MatchByCriteriaSongResponse
> {
  constructor(private readonly useCase: SongMatcher) {}

  subscribedTo(): Query {
    return MatchByCriteriaSongQuery;
  }

  handle(query: MatchByCriteriaSongQuery): Promise<MatchByCriteriaSongResponse> {
    return this.useCase.run(query.musicianId, query.criteria);
  }
}
