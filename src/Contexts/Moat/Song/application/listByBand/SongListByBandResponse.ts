import { Response } from '@Contexts/Shared/domain/Response.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { Song } from '../../domain/Song.js';

export class SongListByBandResponse implements Response {
  constructor(
    private readonly items: Array<Song>,
    private readonly total: number
  ) {}

  toPrimitives(): { items: Array<Primitives<Song>>; total: number } {
    return {
      items: this.items.map((item) => item.toPrimitives()),
      total: this.total
    };
  }
}
