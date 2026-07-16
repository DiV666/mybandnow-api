import { Response } from '@Contexts/Shared/domain/Response.js';
import { SongInstrument } from '../../domain/SongInstrument.js';

interface SongInstrumentListItem {
  id: string;
  name: string;
  instrumentType: string;
  songId: string;
  musicianId: string;
  createdAt: Date;
}

export class MatchByCriteriaSongInstrumentResponse implements Response {
  constructor(
    private readonly items: Array<SongInstrument>,
    private readonly total: number
  ) {}

  toPrimitives(): { items: Array<SongInstrumentListItem>; total: number } {
    return {
      items: this.items.map((item) => {
        const primitives = item.toPrimitives();

        return {
          id: primitives.id,
          name: primitives.name,
          instrumentType: primitives.instrumentType,
          songId: primitives.songId,
          musicianId: primitives.musicianId,
          createdAt: primitives.createdAt
        };
      }),
      total: this.total
    };
  }
}
