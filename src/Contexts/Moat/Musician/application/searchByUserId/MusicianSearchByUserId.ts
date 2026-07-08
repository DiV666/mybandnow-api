import { MusicianSearchByUserIdQuery } from './MusicianSearchByUserIdQuery.js';
import { MusicianSearchByUserIdResponse } from './MusicianSearchByUserIdResponse.js';
import { MusicianRepository } from '../../domain/repository/MusicianRepository.js';
import { MusicianUserId } from '../../domain/value-object/MusicianUserId.js';

export class MusicianSearchByUserId {
  constructor(private readonly repository: MusicianRepository) {}

  async run(query: MusicianSearchByUserIdQuery): Promise<MusicianSearchByUserIdResponse> {
    const userId = new MusicianUserId(query.userId);
    const musician = await this.repository.searchByUserId(userId);

    return new MusicianSearchByUserIdResponse(musician ? musician.toPrimitives() : null);
  }
}
