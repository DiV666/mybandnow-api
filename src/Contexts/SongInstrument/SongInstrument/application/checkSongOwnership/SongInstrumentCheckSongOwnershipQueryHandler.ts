import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { SongInstrumentCheckSongOwnership } from './SongInstrumentCheckSongOwnership.js';
import { SongInstrumentCheckSongOwnershipQuery } from './SongInstrumentCheckSongOwnershipQuery.js';
import { SongInstrumentCheckSongOwnershipResponse } from './SongInstrumentCheckSongOwnershipResponse.js';

export class SongInstrumentCheckSongOwnershipQueryHandler implements QueryHandler<
  SongInstrumentCheckSongOwnershipQuery,
  SongInstrumentCheckSongOwnershipResponse
> {
  constructor(private readonly useCase: SongInstrumentCheckSongOwnership) {}

  subscribedTo(): Query {
    return SongInstrumentCheckSongOwnershipQuery;
  }

  async handle(query: SongInstrumentCheckSongOwnershipQuery): Promise<SongInstrumentCheckSongOwnershipResponse> {
    return this.useCase.run(query);
  }
}
