import { Query } from '@Contexts/Shared/domain/Query.js';
import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { SongFindByIdQuery } from './SongFindByIdQuery.js';
import { SongFindById } from './SongFindById.js';
import { SongFindByIdResponse } from './SongFindByIdResponse.js';

export class SongFindByIdQueryHandler implements QueryHandler<SongFindByIdQuery, SongFindByIdResponse> {
  constructor(private useCase: SongFindById) {}

  subscribedTo(): Query {
    return SongFindByIdQuery;
  }

  async handle(query: SongFindByIdQuery): Promise<SongFindByIdResponse> {
    return this.useCase.run(query.id);
  }
}
