import { Query } from '@Contexts/Shared/domain/Query.js';

export class SongInstrumentUploadRequestUploadUrlQuery extends Query {
  constructor(
    public readonly songId: string,
    public readonly songInstrumentId: string,
    public readonly musicianId: string
  ) {
    super();
  }
}
