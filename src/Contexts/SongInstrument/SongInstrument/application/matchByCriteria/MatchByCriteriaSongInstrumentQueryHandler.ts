import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { MatchByCriteriaSongInstrumentQuery } from './MatchByCriteriaSongInstrumentQuery.js';
import { SongInstrumentMatcher } from './SongInstrumentMatcher.js';
import { MatchByCriteriaSongInstrumentResponse } from './MatchByCriteriaSongInstrumentResponse.js';

export class MatchByCriteriaSongInstrumentQueryHandler implements QueryHandler<
  MatchByCriteriaSongInstrumentQuery,
  MatchByCriteriaSongInstrumentResponse
> {
  constructor(private useCase: SongInstrumentMatcher) {}

  subscribedTo(): Query {
    return MatchByCriteriaSongInstrumentQuery;
  }

  async handle(query: MatchByCriteriaSongInstrumentQuery): Promise<MatchByCriteriaSongInstrumentResponse> {
    return this.useCase.run(query.songId, query.musicianId, query.criteria);
  }
}
