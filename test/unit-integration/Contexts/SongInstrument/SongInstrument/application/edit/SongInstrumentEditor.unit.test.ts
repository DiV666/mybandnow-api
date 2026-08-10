import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import type Logger from '@Contexts/Shared/domain/Logger.js';
import type { SongInstrumentPersistenceRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import type { SongInstrumentAuthorizationRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentAuthorizationRepository.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { SongInstrumentNotExistException } from '@Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { EditSongInstrumentCommand } from '@Contexts/SongInstrument/SongInstrument/application/edit/EditSongInstrumentCommand.js';
import { SongInstrumentEditor } from '@Contexts/SongInstrument/SongInstrument/application/edit/SongInstrumentEditor.js';
import { SongInstrumentMother } from '@Test/unit-integration/Contexts/SongInstrument/SongInstrument/domain/SongInstrumentMother.js';

describe('SongInstrumentEditor', () => {
  it('updates the song instrument metadata when the authenticated musician owns the song', async () => {
    // Arrange
    const logger = mock<Logger>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const useCase = new SongInstrumentEditor(logger, songInstrumentRepository, authorizationRepository);
    const songInstrument = SongInstrumentMother.create();
    const command = new EditSongInstrumentCommand(
      songInstrument.songId.value,
      songInstrument.id.value,
      '99999999-9999-4999-8999-999999999999',
      'Bass',
      '0e7a0d5f-3d2a-4bc1-8d4d-100000000002'
    );

    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    authorizationRepository.isSongOwnedBy.mockResolvedValue(true);

    // Act
    await useCase.run(command);

    // Assert
    expect(songInstrumentRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.objectContaining({ value: 'Bass' }),
        instrumentId: expect.objectContaining({ value: '0e7a0d5f-3d2a-4bc1-8d4d-100000000002' })
      })
    );
  });

  it('throws not found when the song instrument does not belong to the song in the path', async () => {
    // Arrange
    const logger = mock<Logger>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const useCase = new SongInstrumentEditor(logger, songInstrumentRepository, authorizationRepository);
    const songInstrument = SongInstrumentMother.create();
    const command = new EditSongInstrumentCommand(
      'other-song-id',
      songInstrument.id.value,
      '99999999-9999-4999-8999-999999999999',
      'Bass',
      '0e7a0d5f-3d2a-4bc1-8d4d-100000000002'
    );

    songInstrumentRepository.search.mockResolvedValue(songInstrument);

    // Act / Assert
    await expect(useCase.run(command)).rejects.toThrow(SongInstrumentNotExistException);
  });

  it('throws forbidden when the authenticated musician is not the song owner', async () => {
    // Arrange
    const logger = mock<Logger>();
    const songInstrumentRepository = mock<SongInstrumentPersistenceRepository>();
    const authorizationRepository = mock<SongInstrumentAuthorizationRepository>();
    const useCase = new SongInstrumentEditor(logger, songInstrumentRepository, authorizationRepository);
    const songInstrument = SongInstrumentMother.create();
    const command = new EditSongInstrumentCommand(
      songInstrument.songId.value,
      songInstrument.id.value,
      '11111111-1111-4111-8111-111111111111',
      'Bass',
      '0e7a0d5f-3d2a-4bc1-8d4d-100000000002'
    );

    songInstrumentRepository.search.mockResolvedValue(songInstrument);
    authorizationRepository.isSongOwnedBy.mockResolvedValue(false);

    // Act / Assert
    await expect(useCase.run(command)).rejects.toThrow(ForbiddenException);
    expect(songInstrumentRepository.save).not.toHaveBeenCalled();
  });
});
