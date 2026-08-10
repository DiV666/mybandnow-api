import { Response } from '@Contexts/Shared/domain/Response.js';
import { Musician } from '../../domain/Musician.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';

export class MusicianSearchByEmailResponse implements Response {
  constructor(readonly musician: Nullable<Primitives<Musician>>) {}
}
