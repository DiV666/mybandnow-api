import { Query } from '@Contexts/Shared/domain/Query.js';

export class MusicianSearchByEmailQuery extends Query {
  constructor(readonly email: string) {
    super();
  }
}
