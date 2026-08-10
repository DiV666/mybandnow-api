import { Query } from '@Contexts/Shared/domain/Query.js';

export class SongListByBandQuery implements Query {
  constructor(
    readonly bandId: string,
    readonly musicianId: string
  ) {}
}
