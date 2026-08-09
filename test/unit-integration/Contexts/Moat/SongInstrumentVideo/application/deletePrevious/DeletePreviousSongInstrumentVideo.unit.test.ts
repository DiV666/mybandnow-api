import { beforeEach, describe, expect, it } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import { StorageRepository } from '../../../../../../../src/Contexts/Shared/domain/StorageRepository.js';
import { DeletePreviousSongInstrumentVideo } from '../../../../../../../src/Contexts/Moat/SongInstrumentVideo/application/deletePrevious/DeletePreviousSongInstrumentVideo.js';
import { DeletePreviousSongInstrumentVideoCommand } from '../../../../../../../src/Contexts/Moat/SongInstrumentVideo/application/deletePrevious/DeletePreviousSongInstrumentVideoCommand.js';

describe('DeletePreviousSongInstrumentVideo', () => {
  let logger: MockProxy<Logger>;
  let storageRepository: MockProxy<StorageRepository>;
  let useCase: DeletePreviousSongInstrumentVideo;

  beforeEach(() => {
    logger = mock<Logger>();
    storageRepository = mock<StorageRepository>();
    useCase = new DeletePreviousSongInstrumentVideo(logger, storageRepository);
  });

  it('deletes the old finalized object when the replacement points to a new path', async () => {
    // Arrange
    const command = new DeletePreviousSongInstrumentVideoCommand(
      '22345678-1234-4234-8234-123456789012',
      'song-instrument-videos/band-id/song-id/old-process.mp4',
      'song-instrument-videos/band-id/song-id/new-process.mp4'
    );

    // Act
    await useCase.run(command);

    // Assert
    expect(storageRepository.deleteFile).toHaveBeenCalledOnce();
    expect(storageRepository.deleteFile).toHaveBeenCalledWith('song-instrument-videos/band-id/song-id/old-process.mp4');
  });

  it('does not delete anything when the old and new finalized object paths are the same', async () => {
    // Arrange
    const command = new DeletePreviousSongInstrumentVideoCommand(
      '22345678-1234-4234-8234-123456789012',
      'song-instrument-videos/band-id/song-id/same-process.mp4',
      'song-instrument-videos/band-id/song-id/same-process.mp4'
    );

    // Act
    await useCase.run(command);

    // Assert
    expect(storageRepository.deleteFile).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledOnce();
  });

  it('swallows not found deletes to keep cleanup idempotent', async () => {
    // Arrange
    const command = new DeletePreviousSongInstrumentVideoCommand(
      '22345678-1234-4234-8234-123456789012',
      'song-instrument-videos/band-id/song-id/old-process.mp4',
      'song-instrument-videos/band-id/song-id/new-process.mp4'
    );
    storageRepository.deleteFile.mockRejectedValueOnce({ code: 404 });

    // Act
    await expect(useCase.run(command)).resolves.toBeUndefined();

    // Assert
    expect(storageRepository.deleteFile).toHaveBeenCalledWith('song-instrument-videos/band-id/song-id/old-process.mp4');
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it('swallows GCS not found errors reported through the provider message', async () => {
    // Arrange
    const command = new DeletePreviousSongInstrumentVideoCommand(
      '22345678-1234-4234-8234-123456789012',
      'song-instrument-videos/band-id/song-id/old-process.mp4',
      'song-instrument-videos/band-id/song-id/new-process.mp4'
    );
    storageRepository.deleteFile.mockRejectedValueOnce(
      new Error('No such object: song-instrument-videos/band-id/song-id/old-process.mp4')
    );

    // Act
    await expect(useCase.run(command)).resolves.toBeUndefined();

    // Assert
    expect(storageRepository.deleteFile).toHaveBeenCalledWith('song-instrument-videos/band-id/song-id/old-process.mp4');
    expect(logger.warn).toHaveBeenCalledOnce();
  });

  it('rethrows unexpected storage errors', async () => {
    // Arrange
    const command = new DeletePreviousSongInstrumentVideoCommand(
      '22345678-1234-4234-8234-123456789012',
      'song-instrument-videos/band-id/song-id/old-process.mp4',
      'song-instrument-videos/band-id/song-id/new-process.mp4'
    );
    const unexpectedError = new Error('boom');
    storageRepository.deleteFile.mockRejectedValueOnce(unexpectedError);

    // Act / Assert
    await expect(useCase.run(command)).rejects.toThrow(unexpectedError);
  });
});
