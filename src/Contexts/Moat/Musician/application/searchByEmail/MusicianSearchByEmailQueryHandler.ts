import { QueryHandler } from '@Contexts/Shared/domain/QueryHandler.js';
import { Query } from '@Contexts/Shared/domain/Query.js';
import { MusicianSearchByEmail } from './MusicianSearchByEmail.js';
import { MusicianSearchByEmailQuery } from './MusicianSearchByEmailQuery.js';
import { MusicianSearchByEmailResponse } from './MusicianSearchByEmailResponse.js';

export class MusicianSearchByEmailQueryHandler implements QueryHandler<
  MusicianSearchByEmailQuery,
  MusicianSearchByEmailResponse
> {
  constructor(private readonly useCase: MusicianSearchByEmail) {}

  subscribedTo(): Query {
    return MusicianSearchByEmailQuery;
  }

  async handle(query: MusicianSearchByEmailQuery): Promise<MusicianSearchByEmailResponse> {
    return this.useCase.run(query);
  }
}
