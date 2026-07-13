import { Query } from '@Contexts/Shared/domain/Query.js';

export class SongInstrumentFindByIdQuery extends Query {
  constructor(
    readonly songId: string,
    readonly instrumentId: string,
    readonly musicianId: string
  ) {
    super();
  }
}
