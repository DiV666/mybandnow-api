import { Query } from '@Contexts/Shared/domain/Query.js';

export class BandListMembersQuery implements Query {
  constructor(
    readonly bandId: string,
    readonly musicianId: string
  ) {}
}
