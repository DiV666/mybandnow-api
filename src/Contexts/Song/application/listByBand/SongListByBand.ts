import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongAuthorizationRepository } from '../../domain/repository/SongAuthorizationRepository.js';
import { SongPersistenceRepository } from '../../domain/repository/SongPersistenceRepository.js';
import { SongBandId } from '../../domain/value-object/SongBandId.js';
import { SongMusicianId } from '../../domain/value-object/SongMusicianId.js';
import { SongListByBandQuery } from './SongListByBandQuery.js';
import { SongListByBandResponse } from './SongListByBandResponse.js';

export class SongListByBand {
  constructor(
    private readonly persistenceRepository: SongPersistenceRepository,
    private readonly authorizationRepository: SongAuthorizationRepository
  ) {}

  async run(query: SongListByBandQuery): Promise<SongListByBandResponse> {
    const bandId = new SongBandId(query.bandId);
    const musicianId = new SongMusicianId(query.musicianId);
    const isBandMember = await this.authorizationRepository.isBandMember(bandId, musicianId);

    if (!isBandMember) {
      throw new ForbiddenException('Only band members can list songs.');
    }

    const items = await this.persistenceRepository.searchByBandId(bandId);
    const total = await this.persistenceRepository.countByBandId(bandId);

    return new SongListByBandResponse(items, total);
  }
}
