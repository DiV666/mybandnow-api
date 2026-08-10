import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type Logger from '@Contexts/Shared/domain/Logger.js';
import type { SongInstrumentPersistenceRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import type { SongInstrumentAuthorizationRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentAuthorizationRepository.js';
import type { BandMembershipGateway } from '@Contexts/SongInstrument/SongInstrument/domain/BandMembershipGateway.js';
import { SongInstrumentInviter } from '@Contexts/SongInstrument/SongInstrument/application/invite/SongInstrumentInviter.js';
import { InviteSongInstrumentMusicianCommand } from '@Contexts/SongInstrument/SongInstrument/application/invite/InviteSongInstrumentMusicianCommand.js';
import { SongInstrumentMother } from '@Test/unit-integration/Contexts/SongInstrument/SongInstrument/domain/SongInstrumentMother.js';

const BAND_ID = '44444444-4444-4444-8444-444444444444';

describe('SongInstrumentInviter', () => {
  it('reuses the assignment flow with the already-resolved invited musician', async () => {
    const logger = mock<Logger>();
    const bandMembershipGateway = mock<BandMembershipGateway>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const useCase = new SongInstrumentInviter(
      logger,
      bandMembershipGateway,
      songInstrumentRepository,
      authorizationRepository
    );
    const songId = '22222222-2222-4222-8222-222222222222';
    const invitedMusicianId = '66666666-6666-4666-8666-666666666666';
    const currentMusicianId = '55555555-5555-4555-8555-555555555555';
    const ownerMusicianId = '99999999-9999-4999-8999-999999999999';
    const songInstrument = SongInstrumentMother.create({
      songId: songInstrumentSongId(songId),
      musicianId: songInstrumentMusicianId(currentMusicianId)
    });
    const command = new InviteSongInstrumentMusicianCommand(
      songId,
      songInstrument.id.value,
      ownerMusicianId,
      invitedMusicianId,
      BAND_ID
    );

    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    authorizationRepository.isSongOwnedBy.mockResolvedValue(true);

    await useCase.run(command);

    expect(bandMembershipGateway.addMember).toHaveBeenCalledWith(BAND_ID, ownerMusicianId, invitedMusicianId);
    expect(songInstrumentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        musicianId: expect.objectContaining({ value: invitedMusicianId })
      })
    );
  });
});

function songInstrumentMusicianId(value: string) {
  return { value } as never;
}

function songInstrumentSongId(value: string) {
  return { value } as never;
}
