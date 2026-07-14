import { Response } from '@Contexts/Shared/domain/Response.js';
import { SongInstrument } from '../../domain/SongInstrument.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';

export class MatchByCriteriaSongInstrumentResponse implements Response {
  constructor(
    private readonly items: Array<SongInstrument>,
    private readonly total: number
  ) {}

  toPrimitives(): { items: Array<Primitives<SongInstrument>>; total: number } {
    return { items: this.items.map((item) => item.toPrimitives()), total: this.total };
  }
}
