import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { ValidateSongInstrumentUploadOnUploadRequested } from '../../../../../../src/apps/mybandnow/backend/subscribers/ValidateSongInstrumentUploadOnUploadRequested.js';
import { SongInstrumentUploadRequestedDomainEvent } from '../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/SongInstrumentUploadRequestedDomainEvent.js';
import { SongInstrumentProcessValidateCommand } from '../../../../../../src/Contexts/Orchestrator/SongInstrumentProcess/application/SongInstrumentProcessValidateCommand.js';
import type { CommandBus } from '../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('ValidateSongInstrumentUploadOnUploadRequested', () => {
  let logger: MockProxy<Logger>;
  let commandBus: MockProxy<CommandBus>;
  let commandBusResolver: () => CommandBus;

  beforeEach(() => {
    logger = mock<Logger>();
    commandBus = mock<CommandBus>();
    commandBusResolver = vi.fn().mockReturnValue(commandBus);
  });

  it('dispatches SongInstrumentProcessValidateCommand with aggregateId, fileReference, and upload ownership data from the domain event', async () => {
    // Arrange
    const subscriber = new ValidateSongInstrumentUploadOnUploadRequested(
      'moat.song_instrument_upload.upload_requested',
      logger,
      commandBusResolver
    );
    const domainEvent = new SongInstrumentUploadRequestedDomainEvent({
      aggregateId: '12345678-1234-4234-8234-123456789012',
      fileReference: 'song-instrument-uploads/song-id/song-instrument-id/video-id.mp4',
      songId: 'song-id',
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
      songInstrumentId: domainEvent.songInstrumentId
    });
  });

  it('dispatches SongInstrumentProcessValidateCommand when RabbitMQ provides only generic event attributes', async () => {
    // Arrange
    const subscriber = new ValidateSongInstrumentUploadOnUploadRequested(
      'moat.song_instrument_upload.upload_requested',
      logger,
      commandBusResolver
    );
    const domainEvent = {
      aggregateId: '12345678-1234-4234-8234-123456789012',
      attributes: {
        fileReference: 'song-instrument-uploads/song-id/song-instrument-id/video-id.mp4',
        songId: 'song-id',
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
      fileReference: 'song-instrument-uploads/song-id/song-instrument-id/video-id.mp4',
      songId: 'song-id',
      songInstrumentId: 'song-instrument-id'
    });
  });

  it('delegates handlerException to logger.error', () => {
    // Arrange
    const subscriber = new ValidateSongInstrumentUploadOnUploadRequested(
      'moat.song_instrument_upload.upload_requested',
      logger,
      commandBusResolver
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
