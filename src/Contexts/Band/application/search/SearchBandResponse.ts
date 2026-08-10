import { Response } from '@Contexts/Shared/domain/Response.js';
import { Band } from '../../domain/Band.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';

export class SearchBandResponse implements Response {
  readonly model: Band;

  constructor(model: Band) {
    this.model = model;
  }

  toPrimitives(): Primitives<Band> {
    return this.model.toPrimitives();
  }
}
