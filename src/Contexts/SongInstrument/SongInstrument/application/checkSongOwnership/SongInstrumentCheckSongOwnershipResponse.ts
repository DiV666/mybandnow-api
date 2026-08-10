import { Response } from '@Contexts/Shared/domain/Response.js';

export class SongInstrumentCheckSongOwnershipResponse implements Response {
  constructor(readonly isOwner: boolean) {}
}
