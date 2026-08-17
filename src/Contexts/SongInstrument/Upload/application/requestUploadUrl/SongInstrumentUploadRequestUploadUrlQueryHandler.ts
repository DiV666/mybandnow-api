import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { SongInstrumentUploadUrlRequester } from './SongInstrumentUploadUrlRequester.js';
import { SongInstrumentUploadRequestUploadUrlQuery } from './SongInstrumentUploadRequestUploadUrlQuery.js';
import { SongInstrumentUploadRequestUploadUrlResponse } from './SongInstrumentUploadRequestUploadUrlResponse.js';

export class SongInstrumentUploadRequestUploadUrlQueryHandler
  implements QueryHandler<SongInstrumentUploadRequestUploadUrlQuery, SongInstrumentUploadRequestUploadUrlResponse>
{
  constructor(private readonly useCase: SongInstrumentUploadUrlRequester) {}

  subscribedTo(): Query {
    return SongInstrumentUploadRequestUploadUrlQuery;
  }

  async handle(
    query: SongInstrumentUploadRequestUploadUrlQuery
  ): Promise<SongInstrumentUploadRequestUploadUrlResponse> {
    return this.useCase.run(query);
  }
}
