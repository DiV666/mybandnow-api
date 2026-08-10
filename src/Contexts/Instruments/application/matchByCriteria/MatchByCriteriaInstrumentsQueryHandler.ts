import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { MatchByCriteriaInstrumentsQuery } from './MatchByCriteriaInstrumentsQuery.js';
import { InstrumentsMatcher } from './InstrumentsMatcher.js';
import { MatchByCriteriaInstrumentsResponse } from './MatchByCriteriaInstrumentsResponse.js';

export class MatchByCriteriaInstrumentsQueryHandler implements QueryHandler<
  MatchByCriteriaInstrumentsQuery,
  MatchByCriteriaInstrumentsResponse
> {
  constructor(private useCase: InstrumentsMatcher) {}

  subscribedTo(): Query {
    return MatchByCriteriaInstrumentsQuery;
  }

  async handle(query: MatchByCriteriaInstrumentsQuery): Promise<MatchByCriteriaInstrumentsResponse> {
    return this.useCase.run(query.criteria);
  }
}
