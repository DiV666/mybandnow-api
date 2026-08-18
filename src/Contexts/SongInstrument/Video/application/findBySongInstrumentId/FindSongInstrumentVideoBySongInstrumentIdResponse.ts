import { Response } from '@Contexts/Shared/domain/Response.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';

export type PublicSongInstrumentVideo = {
  id: string;
  url: string;
  songInstrumentId: string;
  startTimeMs: number;
};

export class FindSongInstrumentVideoBySongInstrumentIdResponse implements Response {
  constructor(readonly video: Nullable<PublicSongInstrumentVideo>) {}
}
