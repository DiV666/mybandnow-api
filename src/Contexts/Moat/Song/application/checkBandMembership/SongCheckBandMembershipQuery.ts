import { Query } from '@Contexts/Shared/domain/Query.js';

export class SongCheckBandMembershipQuery extends Query {
  constructor(
    readonly bandId: string,
    readonly musicianId: string
  ) {
    super();
  }
}
