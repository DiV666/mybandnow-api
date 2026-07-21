import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type { CommandBus } from '@Contexts/Shared/domain/CommandBus.js';
import type Logger from '@Contexts/Shared/domain/Logger.js';
import type { SongInstrumentPersistenceRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import type { SongInstrumentAuthorizationRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentAuthorizationRepository.js';
import type { SongPersistenceRepository } from '@Contexts/Moat/Song/domain/repository/SongPersistenceRepository.js';
import type { MusicianRepository } from '@Contexts/Moat/Musician/domain/repository/MusicianRepository.js';
import { SongInstrumentInviter } from '@Contexts/Moat/SongInstrument/application/invite/SongInstrumentInviter.js';
import { InviteSongInstrumentMusicianCommand } from '@Contexts/Moat/SongInstrument/application/invite/InviteSongInstrumentMusicianCommand.js';
import { SongInstrumentMother } from '@Test/unit-integration/Contexts/Moat/SongInstrument/domain/SongInstrumentMother.js';
import { SongMother } from '@Test/unit-integration/Contexts/Moat/Song/domain/SongMother.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { MusicianMother } from '@Test/unit-integration/Contexts/Moat/Musician/domain/MusicianMother.js';
import { MusicianIdMother } from '@Test/unit-integration/Contexts/Moat/Musician/domain/MusicianIdMother.js';
import { AddBandMemberCommand } from '@Contexts/Moat/Band/application/addMember/AddBandMemberCommand.js';

describe('SongInstrumentInviter', () => {
  it('throws bad request when the musician email does not resolve to a profile', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songRepository = mock<SongPersistenceRepository>();
    const musicianRepository = mock<MusicianRepository>();
    const useCase = new SongInstrumentInviter(
      logger,
      () => commandBus,
      musicianRepository,
      songInstrumentRepository,
      authorizationRepository,
      songRepository
    );
    const command = new InviteSongInstrumentMusicianCommand(
      'song-id',
      'song-instrument-id',
      'owner-musician-id',
      'missing@example.com'
    );

    musicianRepository.searchByEmail.mockResolvedValue(null);

    await expect(useCase.run(command)).rejects.toThrow(InvalidArgumentException);
    await expect(useCase.run(command)).rejects.toMatchObject({
      code: 'INVALID_ARGUMENT',
      message: 'The provided musician email is not valid for song instrument assignment.'
    });
    expect(commandBus.dispatch).not.toHaveBeenCalled();
    expect(songInstrumentRepository.save).not.toHaveBeenCalled();
  });

  it('resolves the musician by email and reuses the assignment flow', async () => {
    const logger = mock<Logger>();
    const commandBus = mock<CommandBus>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const songRepository = mock<SongPersistenceRepository>();
    const musicianRepository = mock<MusicianRepository>();
    const useCase = new SongInstrumentInviter(
      logger,
      () => commandBus,
      musicianRepository,
      songInstrumentRepository,
      authorizationRepository,
      songRepository
    );
    const song = SongMother.create();
    const targetMusician = MusicianMother.create({
      id: MusicianIdMother.create('66666666-6666-4666-8666-666666666666')
    });
    const currentMusicianId = '55555555-5555-4555-8555-555555555555';
    const ownerMusicianId = '99999999-9999-4999-8999-999999999999';
    const songInstrument = SongInstrumentMother.create({
      songId: song.id as never,
      musicianId: songInstrumentMusicianId(currentMusicianId)
    });
    const command = new InviteSongInstrumentMusicianCommand(
      song.id.value,
      songInstrument.id.value,
      ownerMusicianId,
      'member@example.com'
    );

    musicianRepository.searchByEmail.mockResolvedValue(targetMusician);
    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    authorizationRepository.isSongOwnedBy.mockResolvedValue(true);
    songRepository.search.mockResolvedValue(song);

    await useCase.run(command);

    expect(commandBus.dispatch).toHaveBeenCalledWith(
      new AddBandMemberCommand(song.bandId.value, ownerMusicianId, targetMusician.id.value)
    );
    expect(songInstrumentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        musicianId: expect.objectContaining({ value: targetMusician.id.value })
      })
    );
  });
});

function songInstrumentMusicianId(value: string) {
  return { value } as never;
}
