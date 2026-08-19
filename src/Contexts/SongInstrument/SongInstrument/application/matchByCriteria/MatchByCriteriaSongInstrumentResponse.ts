import { Response } from '@Contexts/Shared/domain/Response.js';
import { SongInstrument } from '../../domain/SongInstrument.js';
import { PublicSongInstrumentUploadResponse } from '../PublicSongInstrumentUploadResponse.js';
import { SongInstrumentVideoPrimitives } from '@Contexts/SongInstrument/Video/domain/SongInstrumentVideo.js';

export interface SongInstrumentListItem {
  id: string;
  name: string;
  instrumentId: string;
  songId: string;
  musicianId: string;
  createdAt: Date;
  video: SongInstrumentVideoPrimitives | null;
  upload: PublicSongInstrumentUploadResponse | null;
}

export interface SongInstrumentListEntry {
  songInstrument: SongInstrument;
  video: SongInstrumentVideoPrimitives | null;
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
          instrumentId: primitives.instrumentId,
          songId: primitives.songId,
          musicianId: primitives.musicianId,
          createdAt: primitives.createdAt,
          video: item.video,
          upload: item.upload
        };
      }),
      total: this.total
    };
  }
}
