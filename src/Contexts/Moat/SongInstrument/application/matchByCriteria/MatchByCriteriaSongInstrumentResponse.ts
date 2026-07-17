import { Response } from '@Contexts/Shared/domain/Response.js';
import { SongInstrument } from '../../domain/SongInstrument.js';
import { PublicSongInstrumentUploadResponse } from '../PublicSongInstrumentUploadResponse.js';

export interface SongInstrumentListItem {
  id: string;
  name: string;
  instrumentType: string;
  songId: string;
  musicianId: string;
  createdAt: Date;
  upload: PublicSongInstrumentUploadResponse | null;
}

export interface SongInstrumentListEntry {
  songInstrument: SongInstrument;
  upload: PublicSongInstrumentUploadResponse | null;
}

export class MatchByCriteriaSongInstrumentResponse implements Response {
  constructor(
    private readonly items: Array<SongInstrumentListEntry>,
    private readonly total: number
  ) {}

  toPrimitives(): { items: Array<SongInstrumentListItem>; total: number } {
    return {
      items: this.items.map((item) => {
        const primitives = item.songInstrument.toPrimitives();

        return {
          id: primitives.id,
          name: primitives.name,
          instrumentType: primitives.instrumentType,
          songId: primitives.songId,
          musicianId: primitives.musicianId,
          createdAt: primitives.createdAt,
          upload: item.upload
        };
      }),
      total: this.total
    };
  }
}
