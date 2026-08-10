import { Query } from '@Contexts/Shared/domain/Query.js';

export class MusicianFindByIdQuery extends Query {
  constructor(readonly id: string) {
    super();
  }
}
