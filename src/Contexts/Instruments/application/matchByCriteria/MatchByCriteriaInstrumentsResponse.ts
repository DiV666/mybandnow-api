import { Response } from '@Contexts/Shared/domain/Response.js';
import { Instruments } from '../../domain/Instruments.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';

export class MatchByCriteriaInstrumentsResponse implements Response {
  constructor(
    private readonly items: Array<Instruments>,
    private readonly total: number
  ) {}

  toPrimitives(): { items: Array<Primitives<Instruments>>; total: number } {
    return { items: this.items.map((item) => item.toPrimitives()), total: this.total };
  }
}
