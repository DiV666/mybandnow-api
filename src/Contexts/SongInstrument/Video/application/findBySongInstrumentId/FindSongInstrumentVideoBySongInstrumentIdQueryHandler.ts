import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { FindSongInstrumentVideoBySongInstrumentIdQuery } from './FindSongInstrumentVideoBySongInstrumentIdQuery.js';
import { SongInstrumentVideoFindBySongInstrumentId } from './SongInstrumentVideoFindBySongInstrumentId.js';
import { FindSongInstrumentVideoBySongInstrumentIdResponse } from './FindSongInstrumentVideoBySongInstrumentIdResponse.js';

export class FindSongInstrumentVideoBySongInstrumentIdQueryHandler implements QueryHandler<
  FindSongInstrumentVideoBySongInstrumentIdQuery,
  FindSongInstrumentVideoBySongInstrumentIdResponse
> {
  constructor(private useCase: SongInstrumentVideoFindBySongInstrumentId) {}

  subscribedTo(): Query {
    return FindSongInstrumentVideoBySongInstrumentIdQuery;
  }

  async handle(
    query: FindSongInstrumentVideoBySongInstrumentIdQuery
  ): Promise<FindSongInstrumentVideoBySongInstrumentIdResponse> {
    return this.useCase.run(query.songInstrumentId);
  }
}
