import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { SongListByBand } from './SongListByBand.js';
import { SongListByBandQuery } from './SongListByBandQuery.js';
import { SongListByBandResponse } from './SongListByBandResponse.js';

export class SongListByBandQueryHandler implements QueryHandler<SongListByBandQuery, SongListByBandResponse> {
  constructor(private readonly useCase: SongListByBand) {}

  subscribedTo(): Query {
    return SongListByBandQuery;
  }

  handle(query: SongListByBandQuery): Promise<SongListByBandResponse> {
    return this.useCase.run(query);
  }
}
