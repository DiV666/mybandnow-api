import { Query } from '@Contexts/Shared/domain/Query.js';

export class SongFindByIdQuery extends Query {
  constructor(readonly id: string) {
    super();
  }
}
