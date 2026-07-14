import { Response } from '@Contexts/Shared/domain/Response.js';

export class SongCheckBandMembershipResponse implements Response {
  constructor(readonly isMember: boolean) {}
}
