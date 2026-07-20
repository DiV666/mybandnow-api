import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { BandNotExistException } from '../../domain/exception/BandNotExistException.js';
import { BandPersistenceRepository } from '../../domain/repository/BandPersistenceRepository.js';
import { BandId } from '../../domain/value-object/BandId.js';
import { BandMemberRoleValues } from '../../domain/value-object/BandMemberRole.js';
import { BandListMembersQuery } from './BandListMembersQuery.js';
import { BandListMembersItemResponse, BandListMembersResponse } from './BandListMembersResponse.js';

export class BandListMembers {
  constructor(private readonly repository: BandPersistenceRepository) {}

  async run(query: BandListMembersQuery): Promise<BandListMembersResponse> {
    const band = await this.repository.search(new BandId(query.bandId));

    if (!band) {
      throw new BandNotExistException(query.bandId);
    }

    const isBandMember =
      band.ownerId.value === query.musicianId ||
      band.members.some((member) => member.musicianId.value === query.musicianId);

    if (!isBandMember) {
      throw new ForbiddenException('Only band members can list band members.');
    }

    const itemsByMusicianId = new Map<string, BandListMembersItemResponse>();
    itemsByMusicianId.set(band.ownerId.value, {
      musicianId: band.ownerId.value,
      role: BandMemberRoleValues.ADMIN
    });

    for (const member of band.members) {
      itemsByMusicianId.set(member.musicianId.value, {
        musicianId: member.musicianId.value,
        role: member.role.value
      });
    }

    return new BandListMembersResponse([...itemsByMusicianId.values()]);
  }
}
