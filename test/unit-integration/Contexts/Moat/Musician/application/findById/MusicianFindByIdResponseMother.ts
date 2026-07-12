import { MusicianFindByIdResponse } from '@Contexts/Moat/Musician/application/findById/MusicianFindByIdResponse.js';
import { Musician } from '@Contexts/Moat/Musician/domain/Musician.js';

export class MusicianFindByIdResponseMother {
  static fromModel(model: Musician): MusicianFindByIdResponse {
    const { id, name, username } = model.toPrimitives();

    return new MusicianFindByIdResponse({ id, name, username });
  }
}
