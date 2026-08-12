import { Query } from '@Contexts/Shared/domain/Query.js';

export class FindSongInstrumentVideoBySongInstrumentIdQuery extends Query {
  constructor(readonly songInstrumentId: string) {
    super();
  }
}
