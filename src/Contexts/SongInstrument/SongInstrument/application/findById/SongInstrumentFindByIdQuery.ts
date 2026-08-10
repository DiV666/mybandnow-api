import { Query } from '@Contexts/Shared/domain/Query.js';

export class SongInstrumentFindByIdQuery extends Query {
  constructor(
    readonly songId: string,
    readonly songInstrumentId: string,
    readonly musicianId: string
  ) {
    super();
  }
}
