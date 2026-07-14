import { SongAuthorizationRepository } from '../../domain/repository/SongAuthorizationRepository.js';
import { SongBandId } from '../../domain/value-object/SongBandId.js';
import { SongMusicianId } from '../../domain/value-object/SongMusicianId.js';
import { SongCheckBandMembershipQuery } from './SongCheckBandMembershipQuery.js';
import { SongCheckBandMembershipResponse } from './SongCheckBandMembershipResponse.js';

export class SongCheckBandMembership {
  constructor(private readonly repository: SongAuthorizationRepository) {}

  async run(query: SongCheckBandMembershipQuery): Promise<SongCheckBandMembershipResponse> {
    const isMember = await this.repository.isBandMember(
      new SongBandId(query.bandId),
      new SongMusicianId(query.musicianId)
    );

    return new SongCheckBandMembershipResponse(isMember);
  }
}
