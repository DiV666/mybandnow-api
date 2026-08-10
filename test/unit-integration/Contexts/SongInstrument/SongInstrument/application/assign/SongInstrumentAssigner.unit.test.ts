import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type Logger from '@Contexts/Shared/domain/Logger.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import type { SongInstrumentPersistenceRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import type { SongInstrumentAuthorizationRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentAuthorizationRepository.js';
import type { BandMembershipGateway } from '@Contexts/SongInstrument/SongInstrument/domain/BandMembershipGateway.js';
import { SongInstrumentAssigner } from '@Contexts/SongInstrument/SongInstrument/application/assign/SongInstrumentAssigner.js';
import { AssignSongInstrumentMusicianCommand } from '@Contexts/SongInstrument/SongInstrument/application/assign/AssignSongInstrumentMusicianCommand.js';
import { SongInstrumentMother } from '@Test/unit-integration/Contexts/SongInstrument/SongInstrument/domain/SongInstrumentMother.js';
import { SongInstrumentNotExistException } from '@Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';

const BAND_ID = '44444444-4444-4444-8444-444444444444';

describe('SongInstrumentAssigner', () => {
  it('reassigns the slot and auto-links the musician to the song band when needed', async () => {
    const logger = mock<Logger>();
    const bandMembershipGateway = mock<BandMembershipGateway>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const useCase = new SongInstrumentAssigner(
      logger,
      bandMembershipGateway,
      songInstrumentRepository,
      authorizationRepository
    );
    const currentMusicianId = '55555555-5555-4555-8555-555555555555';
    const newMusicianId = '66666666-6666-4666-8666-666666666666';
    const ownerMusicianId = '99999999-9999-4999-8999-999999999999';
    const songId = '22222222-2222-4222-8222-222222222222';
    const songInstrument = SongInstrumentMother.create({
      songId: songInstrumentSongId(songId),
      musicianId: songInstrumentMusicianId(currentMusicianId)
    });
    const command = new AssignSongInstrumentMusicianCommand(
      songId,
      songInstrument.id.value,
      ownerMusicianId,
      newMusicianId,
      BAND_ID
    );

    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    authorizationRepository.isSongOwnedBy.mockResolvedValue(true);

    await useCase.run(command);

    expect(bandMembershipGateway.addMember).toHaveBeenCalledWith(BAND_ID, ownerMusicianId, newMusicianId);
    expect(songInstrumentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        musicianId: expect.objectContaining({ value: newMusicianId })
      })
    );
  });

  it('keeps the upload permission semantics by reassigning without duplicating an existing band member link', async () => {
    const logger = mock<Logger>();
    const bandMembershipGateway = mock<BandMembershipGateway>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const useCase = new SongInstrumentAssigner(
      logger,
      bandMembershipGateway,
      songInstrumentRepository,
      authorizationRepository
    );
    const assignedMusicianId = '77777777-7777-4777-8777-777777777777';
    const currentMusicianId = '88888888-8888-4888-8888-888888888888';
    const ownerMusicianId = '99999999-9999-4999-8999-999999999999';
    const songId = '22222222-2222-4222-8222-222222222222';
    const songInstrument = SongInstrumentMother.create({
      songId: songInstrumentSongId(songId),
      musicianId: songInstrumentMusicianId(currentMusicianId)
    });
    const command = new AssignSongInstrumentMusicianCommand(
      songId,
      songInstrument.id.value,
      ownerMusicianId,
      assignedMusicianId,
      BAND_ID
    );

    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    authorizationRepository.isSongOwnedBy.mockResolvedValue(true);

    await useCase.run(command);

    expect(bandMembershipGateway.addMember).toHaveBeenCalledWith(BAND_ID, ownerMusicianId, assignedMusicianId);
    expect(songInstrumentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        musicianId: expect.objectContaining({ value: assignedMusicianId })
      })
    );
  });

  it('throws not found when the song instrument does not belong to the song in the path', async () => {
    const logger = mock<Logger>();
    const bandMembershipGateway = mock<BandMembershipGateway>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const useCase = new SongInstrumentAssigner(
      logger,
      bandMembershipGateway,
      songInstrumentRepository,
      authorizationRepository
    );
    const songInstrument = SongInstrumentMother.create();
    const command = new AssignSongInstrumentMusicianCommand(
      'other-song-id',
      songInstrument.id.value,
      '99999999-9999-4999-8999-999999999999',
      'new-musician-id',
      BAND_ID
    );

    songInstrumentRepository.search.mockResolvedValue(songInstrument);

    await expect(useCase.run(command)).rejects.toThrow(SongInstrumentNotExistException);
  });

  it('throws forbidden when the authenticated musician is not the song owner', async () => {
    const logger = mock<Logger>();
    const bandMembershipGateway = mock<BandMembershipGateway>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const useCase = new SongInstrumentAssigner(
      logger,
      bandMembershipGateway,
      songInstrumentRepository,
      authorizationRepository
    );
    const songInstrument = SongInstrumentMother.create();
    const command = new AssignSongInstrumentMusicianCommand(
      songInstrument.songId.value,
      songInstrument.id.value,
      '11111111-1111-4111-8111-111111111111',
      'new-musician-id',
      BAND_ID
    );

    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    authorizationRepository.isSongOwnedBy.mockResolvedValue(false);

    await expect(useCase.run(command)).rejects.toThrow(ForbiddenException);
    expect(bandMembershipGateway.addMember).not.toHaveBeenCalled();
    expect(songInstrumentRepository.save).not.toHaveBeenCalled();
  });
});

function songInstrumentMusicianId(value: string) {
  return { value } as never;
}

function songInstrumentSongId(value: string) {
  return { value } as never;
}
