import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { MusicianFindByIdQuery } from './MusicianFindByIdQuery.js';
import { MusicianFindById } from './MusicianFindById.js';
import { MusicianFindByIdResponse } from './MusicianFindByIdResponse.js';

export class MusicianFindByIdQueryHandler implements QueryHandler<MusicianFindByIdQuery, MusicianFindByIdResponse> {
  constructor(private useCase: MusicianFindById) {}

  subscribedTo(): Query {
    return MusicianFindByIdQuery;
  }

  async handle(query: MusicianFindByIdQuery): Promise<MusicianFindByIdResponse> {
    return this.useCase.run(query.id);
  }
}
