import { MusicianRepository } from '../../domain/repository/MusicianRepository.js';
import { MusicianNotExistException } from '../../domain/exception/MusicianNotExistException.js';
import { MusicianFindByIdResponse } from './MusicianFindByIdResponse.js';
import { MusicianId } from '../../domain/value-object/MusicianId.js';

export class MusicianFindById {
  constructor(private readonly repository: MusicianRepository) {}

  async run(id: string): Promise<MusicianFindByIdResponse> {
    const model = await this.repository.search(new MusicianId(id));

    if (!model) {
      throw new MusicianNotExistException(id);
    }

    const { id: musicianId, name, username } = model.toPrimitives();

    return new MusicianFindByIdResponse({ id: musicianId, name, username });
  }
}
