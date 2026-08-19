import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type Logger from '@Contexts/Shared/domain/Logger.js';
import type { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import type { BandPersistenceRepository } from '@Contexts/Band/domain/repository/BandPersistenceRepository.js';
import type { SongInstrumentReassignmentGateway } from '@Contexts/Band/domain/SongInstrumentReassignmentGateway.js';
import { BandMemberRemover } from '@Contexts/Band/application/removeMember/BandMemberRemover.js';
import { RemoveBandMemberCommand } from '@Contexts/Band/application/removeMember/RemoveBandMemberCommand.js';
import { BandMother } from '@Test/unit-integration/Contexts/Band/domain/BandMother.js';
import { BandMember } from '@Contexts/Band/domain/BandMember.js';
import { BandMemberId } from '@Contexts/Band/domain/value-object/BandMemberId.js';
import { BandMemberRole } from '@Contexts/Band/domain/value-object/BandMemberRole.js';
import { BandMemberMusicianId } from '@Contexts/Band/domain/value-object/BandMemberMusicianId.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { BandNotExistException } from '@Contexts/Band/domain/exception/BandNotExistException.js';

const buildUseCase = () => {
  const logger = mock<Logger>();
  const repository = mock<BandPersistenceRepository>();
  const eventBus = mock<EventBus>();
  const songInstrumentReassignmentGateway = mock<SongInstrumentReassignmentGateway>();
  const useCase = new BandMemberRemover(logger, repository, eventBus, songInstrumentReassignmentGateway);

  return { logger, repository, eventBus, songInstrumentReassignmentGateway, useCase };
};

describe('BandMemberRemover', () => {
  it('removes the member and reassigns their song instruments to the band owner', async () => {
    const { repository, eventBus, songInstrumentReassignmentGateway, useCase } = buildUseCase();
    const memberMusicianId = '11111111-1111-4111-8111-111111111111';
    const band = BandMother.create({
      members: [
        new BandMember(
          new BandMemberId(BandMemberId.random()),
          new BandMemberMusicianId(memberMusicianId),
          new BandMemberRole('MEMBER')
        )
      ]
    });
    const command = new RemoveBandMemberCommand(band.id.value, band.ownerId.value, memberMusicianId);

    repository.search.mockResolvedValue(band);

    await useCase.run(command);

    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ members: [] }));
    expect(eventBus.publish).toHaveBeenCalledOnce();
    expect(songInstrumentReassignmentGateway.reassignBandMemberInstruments).toHaveBeenCalledWith(
      band.id.value,
      memberMusicianId,
      band.ownerId.value
    );
  });

  it('does nothing when the musician is not a member of the band', async () => {
    const { repository, eventBus, songInstrumentReassignmentGateway, useCase } = buildUseCase();
    const band = BandMother.create();
    const command = new RemoveBandMemberCommand(
      band.id.value,
      band.ownerId.value,
      '22222222-2222-4222-8222-222222222222'
    );

    repository.search.mockResolvedValue(band);

    await useCase.run(command);

    expect(repository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
    expect(songInstrumentReassignmentGateway.reassignBandMemberInstruments).not.toHaveBeenCalled();
  });

  it('throws forbidden when a non-owner tries to remove a band member', async () => {
    const { repository, useCase } = buildUseCase();
    const band = BandMother.create();
    const command = new RemoveBandMemberCommand(
      band.id.value,
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444'
    );

    repository.search.mockResolvedValue(band);

    await expect(useCase.run(command)).rejects.toThrow(ForbiddenException);
  });

  it('throws invalid argument when trying to remove the band owner', async () => {
    const { repository, useCase } = buildUseCase();
    const band = BandMother.create();
    const command = new RemoveBandMemberCommand(band.id.value, band.ownerId.value, band.ownerId.value);

    repository.search.mockResolvedValue(band);

    await expect(useCase.run(command)).rejects.toThrow(InvalidArgumentException);
  });

  it('throws band not exist when the band cannot be found', async () => {
    const { repository, useCase } = buildUseCase();
    const command = new RemoveBandMemberCommand(
      '55555555-5555-4555-8555-555555555555',
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444'
    );

    repository.search.mockResolvedValue(null);

    await expect(useCase.run(command)).rejects.toThrow(BandNotExistException);
  });
});
