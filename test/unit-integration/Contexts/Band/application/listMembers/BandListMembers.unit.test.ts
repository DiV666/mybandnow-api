import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { BandPersistenceRepository } from '@Contexts/Band/domain/repository/BandPersistenceRepository.js';
import { BandListMembers } from '@Contexts/Band/application/listMembers/BandListMembers.js';
import { BandListMembersQuery } from '@Contexts/Band/application/listMembers/BandListMembersQuery.js';
import { BandListMembersResponse } from '@Contexts/Band/application/listMembers/BandListMembersResponse.js';
import { BandMother } from '@Test/unit-integration/Contexts/Band/domain/BandMother.js';
import { BandMember } from '@Contexts/Band/domain/BandMember.js';
import { BandMemberId } from '@Contexts/Band/domain/value-object/BandMemberId.js';
import { BandMemberRole } from '@Contexts/Band/domain/value-object/BandMemberRole.js';
import { BandMemberMusicianId } from '@Contexts/Band/domain/value-object/BandMemberMusicianId.js';
import { BandOwnerId } from '@Contexts/Band/domain/value-object/BandOwnerId.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { BandNotExistException } from '@Contexts/Band/domain/exception/BandNotExistException.js';

describe('BandListMembers', () => {
  it('returns the band members for an authenticated band member', async () => {
    // Arrange
    const repository = mock<BandPersistenceRepository>();
    const ownerId = '11111111-1111-4111-8111-111111111111';
    const memberId = '22222222-2222-4222-8222-222222222222';
    const band = BandMother.create({
      ownerId: new BandOwnerId(ownerId),
      members: [
        new BandMember(
          new BandMemberId(BandMemberId.random()),
          new BandMemberMusicianId(ownerId),
          new BandMemberRole('ADMIN')
        ),
        new BandMember(
          new BandMemberId(BandMemberId.random()),
          new BandMemberMusicianId(memberId),
          new BandMemberRole('MEMBER')
        )
      ]
    });
    const useCase = new BandListMembers(repository);
    const query = new BandListMembersQuery(band.id.value, memberId);

    repository.search.mockResolvedValue(band);

    // Act
    const response = await useCase.run(query);

    // Assert
    expect(repository.search).toHaveBeenCalledOnce();
    expect(response).toEqual(
      new BandListMembersResponse([
        { musicianId: ownerId, role: 'ADMIN' },
        { musicianId: memberId, role: 'MEMBER' }
      ])
    );
  });

  it('throws forbidden when the authenticated musician does not belong to the band', async () => {
    // Arrange
    const repository = mock<BandPersistenceRepository>();
    const band = BandMother.create();
    const useCase = new BandListMembers(repository);
    const query = new BandListMembersQuery(band.id.value, '33333333-3333-4333-8333-333333333333');

    repository.search.mockResolvedValue(band);

    // Act / Assert
    await expect(useCase.run(query)).rejects.toThrow(ForbiddenException);
  });

  it('throws not found when the band does not exist', async () => {
    // Arrange
    const repository = mock<BandPersistenceRepository>();
    const useCase = new BandListMembers(repository);
    const query = new BandListMembersQuery(
      '44444444-4444-4444-8444-444444444444',
      '55555555-5555-4555-8555-555555555555'
    );

    repository.search.mockResolvedValue(null);

    // Act / Assert
    await expect(useCase.run(query)).rejects.toThrow(BandNotExistException);
  });
});
