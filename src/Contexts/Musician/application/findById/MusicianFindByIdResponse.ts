import { Response } from '@Contexts/Shared/domain/Response.js';
import { Musician } from '../../domain/Musician.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';

export type PublicMusician = Pick<Primitives<Musician>, 'id' | 'name' | 'username'>;

export class MusicianFindByIdResponse implements Response {
  constructor(readonly musician: PublicMusician) {}
}
