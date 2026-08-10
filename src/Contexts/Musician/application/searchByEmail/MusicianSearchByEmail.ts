import { MusicianRepository } from '../../domain/repository/MusicianRepository.js';
import { MusicianEmail } from '../../domain/value-object/MusicianEmail.js';
import { MusicianSearchByEmailQuery } from './MusicianSearchByEmailQuery.js';
import { MusicianSearchByEmailResponse } from './MusicianSearchByEmailResponse.js';

export class MusicianSearchByEmail {
  constructor(private readonly musicianRepository: MusicianRepository) {}

  async run(query: MusicianSearchByEmailQuery): Promise<MusicianSearchByEmailResponse> {
    const email = new MusicianEmail(query.email);
    const musician = await this.musicianRepository.searchByEmail(email.value);

    return new MusicianSearchByEmailResponse(musician ? musician.toPrimitives() : null);
  }
}
