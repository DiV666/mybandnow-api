import { Query } from '@Contexts/Shared/domain/Query.js';

export class SongInstrumentCheckSongOwnershipQuery extends Query {
  constructor(
    readonly songId: string,
    readonly musicianId: string
  ) {
    super();
  }
}
