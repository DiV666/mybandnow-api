import { MusicianSearchByUserIdResponse } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdResponse.js';
import { Musician } from '@Contexts/Musician/domain/Musician.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';

export class MusicianSearchByUserIdResponseMother {
  static create(musician: Nullable<Musician>): MusicianSearchByUserIdResponse {
    return new MusicianSearchByUserIdResponse(musician ? musician.toPrimitives() : null);
  }
}
