import { Response } from '@Contexts/Shared/domain/Response.js';
import { Band } from '../../domain/Band.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';

export class MatchByCriteriaBandResponse implements Response {
  constructor(
    private readonly items: Array<Band>,
    private readonly total: number
  ) {}

  toPrimitives(): { items: Array<Primitives<Band>>; total: number } {
    return { items: this.items.map((item) => item.toPrimitives()), total: this.total };
  }
}
