import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { Query } from '@Contexts/Shared/domain/Query.js';
import { MusicianSearchByUserIdQuery } from './MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserId } from './MusicianSearchByUserId.js';
import { MusicianSearchByUserIdResponse } from './MusicianSearchByUserIdResponse.js';

export class MusicianSearchByUserIdQueryHandler implements QueryHandler<
  MusicianSearchByUserIdQuery,
  MusicianSearchByUserIdResponse
> {
  constructor(private useCase: MusicianSearchByUserId) {}

  subscribedTo(): Query {
    return MusicianSearchByUserIdQuery;
  }

  async handle(query: MusicianSearchByUserIdQuery): Promise<MusicianSearchByUserIdResponse> {
    return this.useCase.run(query);
  }
}
