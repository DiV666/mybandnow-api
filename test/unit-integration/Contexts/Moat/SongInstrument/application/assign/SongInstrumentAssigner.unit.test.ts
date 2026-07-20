import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { CommandBus } from '@Contexts/Shared/domain/CommandBus.js';
import type Logger from '@Contexts/Shared/domain/Logger.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import type { SongInstrumentPersistenceRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import type { SongInstrumentAuthorizationRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentAuthorizationRepository.js';
import type { SongPersistenceRepository } from '@Contexts/Moat/Song/domain/repository/SongPersistenceRepository.js';
import { AddBandMemberCommand } from '@Contexts/Moat/Band/application/addMember/AddBandMemberCommand.js';
import { SongInstrumentAssigner } from '@Contexts/Moat/SongInstrument/application/assign/SongInstrumentAssigner.js';
import { AssignSongInstrumentMusicianCommand } from '@Contexts/Moat/SongInstrument/application/assign/AssignSongInstrumentMusicianCommand.js';
import { SongInstrumentMother } from '@Test/unit-integration/Contexts/Moat/SongInstrument/domain/SongInstrumentMother.js';
import { SongMother } from '@Test/unit-integration/Contexts/Moat/Song/domain/SongMother.js';
import { SongInstrumentNotExistException } from '@Contexts/Moat/SongInstrument/domain/exception/SongInstrumentNotExistException.js';

describe('SongInstrumentAssigner', () => {
  it('reassigns the slot and auto-links the musician to the song band when needed', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songRepository = mock<SongPersistenceRepository>();
    const useCase = new SongInstrumentAssigner(
      logger,
      () => commandBus,
      songInstrumentRepository,
      authorizationRepository,
      songRepository
    );
    const song = SongMother.create();
    const currentMusicianId = '55555555-5555-4555-8555-555555555555';
    const newMusicianId = '66666666-6666-4666-8666-666666666666';
    const ownerMusicianId = '99999999-9999-4999-8999-999999999999';
    const songInstrument = SongInstrumentMother.create({
      songId: song.id as never,
      musicianId: songInstrumentMusicianId(currentMusicianId)
    });
    const command = new AssignSongInstrumentMusicianCommand(
      song.id.value,
      songInstrument.id.value,
      ownerMusicianId,
      newMusicianId
    );

    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    authorizationRepository.isSongOwnedBy.mockResolvedValue(true);
    songRepository.search.mockResolvedValue(song);

    await useCase.run(command);

    expect(commandBus.dispatch).toHaveBeenCalledWith(
      new AddBandMemberCommand(song.bandId.value, ownerMusicianId, newMusicianId)
    );
    expect(songInstrumentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        musicianId: expect.objectContaining({ value: newMusicianId })
      })
    );
  });

  it('keeps the upload permission semantics by reassigning without duplicating an existing band member link', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songRepository = mock<SongPersistenceRepository>();
    const useCase = new SongInstrumentAssigner(
      logger,
      () => commandBus,
      songInstrumentRepository,
      authorizationRepository,
      songRepository
    );
    const assignedMusicianId = '77777777-7777-4777-8777-777777777777';
    const currentMusicianId = '88888888-8888-4888-8888-888888888888';
    const ownerMusicianId = '99999999-9999-4999-8999-999999999999';
    const song = SongMother.create();
    const songInstrument = SongInstrumentMother.create({
      songId: song.id as never,
      musicianId: songInstrumentMusicianId(currentMusicianId)
    });
    const command = new AssignSongInstrumentMusicianCommand(
      song.id.value,
      songInstrument.id.value,
      ownerMusicianId,
      assignedMusicianId
    );

    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    authorizationRepository.isSongOwnedBy.mockResolvedValue(true);
    songRepository.search.mockResolvedValue(song);

    await useCase.run(command);

    expect(commandBus.dispatch).toHaveBeenCalledWith(
      new AddBandMemberCommand(song.bandId.value, ownerMusicianId, assignedMusicianId)
    );
    expect(songInstrumentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        musicianId: expect.objectContaining({ value: assignedMusicianId })
      })
    );
  });

  it('throws not found when the song instrument does not belong to the song in the path', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songRepository = mock<SongPersistenceRepository>();
    const useCase = new SongInstrumentAssigner(
      logger,
      () => commandBus,
      songInstrumentRepository,
      authorizationRepository,
      songRepository
    );
    const songInstrument = SongInstrumentMother.create();
    const command = new AssignSongInstrumentMusicianCommand(
      'other-song-id',
      songInstrument.id.value,
      '99999999-9999-4999-8999-999999999999',
      'new-musician-id'
    );

    songInstrumentRepository.search.mockResolvedValue(songInstrument);

    await expect(useCase.run(command)).rejects.toThrow(SongInstrumentNotExistException);
  });

  it('throws forbidden when the authenticated musician is not the song owner', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songRepository = mock<SongPersistenceRepository>();
    const useCase = new SongInstrumentAssigner(
      logger,
      () => commandBus,
      songInstrumentRepository,
      authorizationRepository,
      songRepository
    );
    const songInstrument = SongInstrumentMother.create();
    const command = new AssignSongInstrumentMusicianCommand(
      songInstrument.songId.value,
      songInstrument.id.value,
      '11111111-1111-4111-8111-111111111111',
      'new-musician-id'
    );

    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    authorizationRepository.isSongOwnedBy.mockResolvedValue(false);

    await expect(useCase.run(command)).rejects.toThrow(ForbiddenException);
    expect(commandBus.dispatch).not.toHaveBeenCalled();
    expect(songInstrumentRepository.save).not.toHaveBeenCalled();
  });
});

function songInstrumentMusicianId(value: string) {
  return { value } as never;
}
