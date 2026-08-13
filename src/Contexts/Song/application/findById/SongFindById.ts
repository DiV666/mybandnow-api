import { SongPersistenceRepository } from '../../domain/repository/SongPersistenceRepository.js';
import { SongId } from '../../domain/value-object/SongId.js';
import { SongFindByIdResponse } from './SongFindByIdResponse.js';

export class SongFindById {
  constructor(private readonly repository: SongPersistenceRepository) {}

  async run(id: string): Promise<SongFindByIdResponse> {
    const song = await this.repository.search(new SongId(id));

    if (!song) {
      return new SongFindByIdResponse(null);
    }

    const { id: songId, bandId, title, originalVideoclipUrl } = song.toPrimitives();

    return new SongFindByIdResponse({ id: songId, bandId, title, originalVideoclipUrl });
  }
}
