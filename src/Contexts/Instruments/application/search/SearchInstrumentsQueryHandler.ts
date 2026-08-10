import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { SearchInstrumentsQuery } from './SearchInstrumentsQuery.js';
import { InstrumentsFinder } from './InstrumentsFinder.js';
import { SearchInstrumentsResponse } from './SearchInstrumentsResponse.js';

export class SearchInstrumentsQueryHandler implements QueryHandler<SearchInstrumentsQuery, SearchInstrumentsResponse> {
  constructor(private useCase: InstrumentsFinder) {}

  subscribedTo(): Query {
    return SearchInstrumentsQuery;
  }

  async handle(query: SearchInstrumentsQuery): Promise<SearchInstrumentsResponse> {
    return this.useCase.run({ id: query.id });
  }
}
