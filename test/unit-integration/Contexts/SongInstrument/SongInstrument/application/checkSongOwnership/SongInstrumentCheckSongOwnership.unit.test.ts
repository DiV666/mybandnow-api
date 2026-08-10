import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { SongInstrumentCheckSongOwnership } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnership.js';
import { SongInstrumentCheckSongOwnershipQuery } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnershipQuery.js';
import type { SongInstrumentAuthorizationRepository } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentAuthorizationRepository.js';
import { SongInstrumentCheckSongOwnershipResponse } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnershipResponse.js';
import { SongInstrumentSongId } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentSongId.js';
import { SongInstrumentMusicianId } from '../../../../../../../src/Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentMusicianId.js';

describe('SongInstrumentCheckSongOwnership', () => {
  it('returns true when the musician owns the song', async () => {
    // Arrange
    const repository = mock<SongInstrumentAuthorizationRepository>();
    const useCase = new SongInstrumentCheckSongOwnership(repository);
    const query = new SongInstrumentCheckSongOwnershipQuery(
      '8d3db4a0-8a60-4484-8d02-beb95e7576d2',
      'a57d4f73-c188-481d-82c3-a561c1b8d87d'
    );
    repository.isSongOwnedBy.mockResolvedValue(true);

    // Act
    const response = await useCase.run(query);

    // Assert
    expect(repository.isSongOwnedBy).toHaveBeenCalledExactlyOnceWith(
      new SongInstrumentSongId(query.songId),
      new SongInstrumentMusicianId(query.musicianId)
    );
    expect(response).toEqual(new SongInstrumentCheckSongOwnershipResponse(true));
  });

  it('returns false when the musician does not own the song', async () => {
    // Arrange
    const repository = mock<SongInstrumentAuthorizationRepository>();
    const useCase = new SongInstrumentCheckSongOwnership(repository);
    const query = new SongInstrumentCheckSongOwnershipQuery(
      '8d3db4a0-8a60-4484-8d02-beb95e7576d2',
      'a57d4f73-c188-481d-82c3-a561c1b8d87d'
    );
    repository.isSongOwnedBy.mockResolvedValue(false);

    // Act
    const response = await useCase.run(query);

    // Assert
    expect(response).toEqual(new SongInstrumentCheckSongOwnershipResponse(false));
  });
});
