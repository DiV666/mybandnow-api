import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type Logger from '@Contexts/Shared/domain/Logger.js';
import type { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import type { BandPersistenceRepository } from '@Contexts/Moat/Band/domain/repository/BandPersistenceRepository.js';
import { BandMemberAdder } from '@Contexts/Moat/Band/application/addMember/BandMemberAdder.js';
import { AddBandMemberCommand } from '@Contexts/Moat/Band/application/addMember/AddBandMemberCommand.js';
import { BandMother } from '@Test/unit-integration/Contexts/Moat/Band/domain/BandMother.js';
import { BandMember } from '@Contexts/Moat/Band/domain/BandMember.js';
import { BandMemberId } from '@Contexts/Moat/Band/domain/value-object/BandMemberId.js';
import { BandMemberRole } from '@Contexts/Moat/Band/domain/value-object/BandMemberRole.js';
import { MusicianId } from '@Contexts/Moat/Musician/domain/value-object/MusicianId.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';

describe('BandMemberAdder', () => {
  it('adds a MEMBER role when the band owner adds a musician by email', async () => {
    const logger = mock<Logger>();
    const repository = mock<BandPersistenceRepository>();
    const eventBus = mock<EventBus>();
    const useCase = new BandMemberAdder(logger, repository, eventBus);
    const band = BandMother.create();
    const newMusicianId = '11111111-1111-4111-8111-111111111111';
    const command = new AddBandMemberCommand(band.id.value, band.ownerId.value, newMusicianId);

    repository.search.mockResolvedValue(band);

    await useCase.run(command);

    expect(repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        members: [
          expect.objectContaining({
            musicianId: expect.objectContaining({ value: newMusicianId }),
            role: expect.objectContaining({ value: 'MEMBER' })
          })
        ]
      })
    );
    expect(eventBus.publish).toHaveBeenCalledOnce();
  });

  it('does not create duplicate membership when the musician is already linked to the band', async () => {
    const logger = mock<Logger>();
    const repository = mock<BandPersistenceRepository>();
    const eventBus = mock<EventBus>();
    const useCase = new BandMemberAdder(logger, repository, eventBus);
    const existingMemberId = '22222222-2222-4222-8222-222222222222';
    const band = BandMother.create({
      members: [
        new BandMember(
          new BandMemberId(BandMemberId.random()),
          new MusicianId(existingMemberId),
          new BandMemberRole('MEMBER')
        )
      ]
    });
    const command = new AddBandMemberCommand(band.id.value, band.ownerId.value, existingMemberId);

    repository.search.mockResolvedValue(band);

    await useCase.run(command);

    expect(repository.save).not.toHaveBeenCalled();
    expect(eventBus.publish).not.toHaveBeenCalled();
  });

  it('throws forbidden when a non-owner tries to add a band member', async () => {
    const logger = mock<Logger>();
    const repository = mock<BandPersistenceRepository>();
    const eventBus = mock<EventBus>();
    const useCase = new BandMemberAdder(logger, repository, eventBus);
    const band = BandMother.create();
    const command = new AddBandMemberCommand(
      band.id.value,
      '33333333-3333-4333-8333-333333333333',
      '44444444-4444-4444-8444-444444444444'
    );

    repository.search.mockResolvedValue(band);

    await expect(useCase.run(command)).rejects.toThrow(ForbiddenException);
  });
});
