import { Query } from '@Contexts/Shared/domain/Query.js';

export class MusicianSearchByUserIdQuery extends Query {
  constructor(readonly userId: string) {
    super();
  }
}
