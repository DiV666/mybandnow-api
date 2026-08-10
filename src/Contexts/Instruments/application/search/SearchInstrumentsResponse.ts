import { Response } from '@Contexts/Shared/domain/Response.js';
import { Instruments } from '../../domain/Instruments.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';

export class SearchInstrumentsResponse implements Response {
  readonly model: Instruments;

  constructor(model: Instruments) {
    this.model = model;
  }

  toPrimitives(): Primitives<Instruments> {
    return this.model.toPrimitives();
  }
}
