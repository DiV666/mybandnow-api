import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { ValidateSongInstrumentUploadOnUploadRequested } from '../../../../../../src/apps/mybandnow/backend/subscribers/ValidateSongInstrumentUploadOnUploadRequested.js';
import { SongInstrumentUploadRequestedDomainEvent } from '../../../../../../src/Contexts/SongInstrument/Upload/domain/SongInstrumentUploadRequestedDomainEvent.js';
import { SongInstrumentProcessValidateCommand } from '../../../../../../src/Contexts/Orchestrator/SongInstrumentProcess/application/SongInstrumentProcessValidateCommand.js';
import type { CommandBus } from '../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import type { SongPersistenceRepository } from '../../../../../../src/Contexts/Song/domain/repository/SongPersistenceRepository.js';
import { Song } from '../../../../../../src/Contexts/Song/domain/Song.js';

const BAND_ID = '32345678-1234-4234-8234-123456789012';

describe('ValidateSongInstrumentUploadOnUploadRequested', () => {
  let logger: MockProxy<Logger>;
  let commandBus: MockProxy<CommandBus>;
  let commandBusResolver: () => CommandBus;
  let songRepository: MockProxy<SongPersistenceRepository>;

  beforeEach(() => {
    logger = mock<Logger>();
    commandBus = mock<CommandBus>();
    commandBusResolver = vi.fn().mockReturnValue(commandBus);
    songRepository = mock<SongPersistenceRepository>();
    songRepository.search.mockResolvedValue(
      Song.create({
        id: '52345678-1234-4234-8234-123456789012',
        bandId: BAND_ID,
        title: 'Uploaded song',
        originalVideoclipUrl: 'https://cdn.example.com/original.mp4'
      })
    );
  });

  it('dispatches SongInstrumentProcessValidateCommand with aggregateId, fileReference, and upload ownership data from the domain event', async () => {
    // Arrange
    const subscriber = new ValidateSongInstrumentUploadOnUploadRequested(
      'song_instrument.1.upload.requested',
      logger,
      commandBusResolver,
      songRepository
    );
    const domainEvent = new SongInstrumentUploadRequestedDomainEvent({
      aggregateId: '12345678-1234-4234-8234-123456789012',
      fileReference: 'song-instrument-uploads/62345678-1234-4234-8234-123456789012/song-instrument-id/video-id.mp4',
      songId: '62345678-1234-4234-8234-123456789012',
      songInstrumentId: 'song-instrument-id'
    });

    // Act
    await subscriber.on(domainEvent);

    // Assert
    expect(commandBusResolver).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledWith(expect.any(SongInstrumentProcessValidateCommand));

    const [command] = commandBus.dispatch.mock.calls[0] ?? [];

    expect(command).toBeInstanceOf(SongInstrumentProcessValidateCommand);
    expect(command).toMatchObject({
      aggregateId: domainEvent.aggregateId,
      fileReference: domainEvent.fileReference,
      songId: domainEvent.songId,
      songInstrumentId: domainEvent.songInstrumentId,
      bandId: BAND_ID
    });
  });

  it('dispatches SongInstrumentProcessValidateCommand when RabbitMQ provides only generic event attributes', async () => {
    // Arrange
    const subscriber = new ValidateSongInstrumentUploadOnUploadRequested(
      'song_instrument.1.upload.requested',
      logger,
      commandBusResolver,
      songRepository
    );
    const domainEvent = {
      aggregateId: '12345678-1234-4234-8234-123456789012',
      attributes: {
        fileReference: 'song-instrument-uploads/62345678-1234-4234-8234-123456789012/song-instrument-id/video-id.mp4',
        songId: '62345678-1234-4234-8234-123456789012',
        songInstrumentId: 'song-instrument-id'
      }
    } as unknown as SongInstrumentUploadRequestedDomainEvent;

    // Act
    await subscriber.on(domainEvent);

    // Assert
    const [command] = commandBus.dispatch.mock.calls[0] ?? [];

    expect(command).toBeInstanceOf(SongInstrumentProcessValidateCommand);
    expect(command).toMatchObject({
      aggregateId: domainEvent.aggregateId,
      fileReference: 'song-instrument-uploads/62345678-1234-4234-8234-123456789012/song-instrument-id/video-id.mp4',
      songId: '62345678-1234-4234-8234-123456789012',
      songInstrumentId: 'song-instrument-id',
      bandId: BAND_ID
    });
  });

  it('throws when the song referenced by the upload no longer exists', async () => {
    // Arrange
    songRepository.search.mockResolvedValue(null);
    const subscriber = new ValidateSongInstrumentUploadOnUploadRequested(
      'song_instrument.1.upload.requested',
      logger,
      commandBusResolver,
      songRepository
    );
    const domainEvent = new SongInstrumentUploadRequestedDomainEvent({
      aggregateId: '12345678-1234-4234-8234-123456789012',
      fileReference: 'song-instrument-uploads/62345678-1234-4234-8234-123456789012/song-instrument-id/video-id.mp4',
      songId: '62345678-1234-4234-8234-123456789012',
      songInstrumentId: 'song-instrument-id'
    });

    // Act + Assert
    await expect(subscriber.on(domainEvent)).rejects.toThrow(InvalidArgumentException);
    expect(commandBus.dispatch).not.toHaveBeenCalled();
  });

  it('delegates handlerException to logger.error', () => {
    // Arrange
    const subscriber = new ValidateSongInstrumentUploadOnUploadRequested(
      'song_instrument.1.upload.requested',
      logger,
      commandBusResolver,
      songRepository
    );
    const exception = new InvalidArgumentException({ message: 'invalid songInstrumentUpload payload' });

    // Act
    subscriber.handlerException(exception);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      exception,
      `[ValidateSongInstrumentUploadOnUploadRequested] Exception handler caught: ${exception.message}`
    );
  });
});
