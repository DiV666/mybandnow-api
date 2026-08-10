import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { SongInstrumentFindById } from './SongInstrumentFindById.js';
import { SongInstrumentFindByIdQuery } from './SongInstrumentFindByIdQuery.js';
import { SongInstrumentFindByIdResponse } from './SongInstrumentFindByIdResponse.js';

export class SongInstrumentFindByIdQueryHandler implements QueryHandler<
  SongInstrumentFindByIdQuery,
  SongInstrumentFindByIdResponse
> {
  constructor(private readonly useCase: SongInstrumentFindById) {}

  subscribedTo(): Query {
    return SongInstrumentFindByIdQuery;
  }

  handle(query: SongInstrumentFindByIdQuery): Promise<SongInstrumentFindByIdResponse> {
    return this.useCase.run(query);
  }
}
