import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { SearchBandQuery } from './SearchBandQuery.js';
import { BandFinder } from './BandFinder.js';
import { SearchBandResponse } from './SearchBandResponse.js';

export class SearchBandQueryHandler implements QueryHandler<SearchBandQuery, SearchBandResponse> {
  constructor(private useCase: BandFinder) {}

  subscribedTo(): Query {
    return SearchBandQuery;
  }

  async handle(query: SearchBandQuery): Promise<SearchBandResponse> {
    return this.useCase.run({ authenticatedUser: query.authenticatedUser, id: query.id });
  }
}
