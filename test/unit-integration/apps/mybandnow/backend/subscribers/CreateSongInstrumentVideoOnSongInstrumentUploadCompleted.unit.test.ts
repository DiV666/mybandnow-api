import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { CreateSongInstrumentVideoOnSongInstrumentUploadCompleted } from '../../../../../../src/apps/mybandnow/backend/subscribers/CreateSongInstrumentVideoOnSongInstrumentUploadCompleted.js';
import { SongInstrumentUploadCompletedDomainEvent } from '../../../../../../src/Contexts/SongInstrument/Upload/domain/SongInstrumentUploadCompletedDomainEvent.js';
import { CreateSongInstrumentVideoCommand } from '../../../../../../src/Contexts/SongInstrument/Video/application/create/CreateSongInstrumentVideoCommand.js';
import type { CommandBus } from '../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('CreateSongInstrumentVideoOnSongInstrumentUploadCompleted', () => {
  let logger: MockProxy<Logger>;
  let commandBus: MockProxy<CommandBus>;
  let commandBusResolver: () => CommandBus;

  beforeEach(() => {
    logger = mock<Logger>();
    commandBus = mock<CommandBus>();
    commandBusResolver = vi.fn().mockReturnValue(commandBus);
  });

  it('dispatches CreateSongInstrumentVideoCommand with business completion payload', async () => {
    // Arrange
    const subscriber = new CreateSongInstrumentVideoOnSongInstrumentUploadCompleted(
      'moat.song_instrument_upload.completed',
      logger,
      commandBusResolver
    );
    const domainEvent = new SongInstrumentUploadCompletedDomainEvent({
      aggregateId: '12345678-1234-4234-8234-123456789012',
      id: '12345678-1234-4234-8234-123456789012',
      songInstrumentId: '22345678-1234-4234-8234-123456789012',
      url: 'tracks/12345678-1234-4234-8234-123456789012.mp4',
      duration: 120,
      size: 100000
    });

    // Act
    await subscriber.on(domainEvent);

    // Assert
    expect(commandBusResolver).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledWith(expect.any(CreateSongInstrumentVideoCommand));

    const [command] = commandBus.dispatch.mock.calls[0] ?? [];

    expect(command).toBeInstanceOf(CreateSongInstrumentVideoCommand);
    expect(command).toMatchObject({
      id: domainEvent.aggregateId,
      songInstrumentId: '22345678-1234-4234-8234-123456789012',
      url: 'tracks/12345678-1234-4234-8234-123456789012.mp4',
      duration: 120,
      size: 100000
    });
  });

  it('dispatches CreateSongInstrumentVideoCommand when RabbitMQ provides only generic event attributes', async () => {
    // Arrange
    const subscriber = new CreateSongInstrumentVideoOnSongInstrumentUploadCompleted(
      'moat.song_instrument_upload.completed',
      logger,
      commandBusResolver
    );
    const domainEvent = {
      aggregateId: '12345678-1234-4234-8234-123456789012',
      attributes: {
        id: '12345678-1234-4234-8234-123456789012',
        songInstrumentId: '22345678-1234-4234-8234-123456789012',
        url: 'tracks/from-rabbitmq.mp4',
        duration: 121,
        size: 100001
      }
    } as unknown as SongInstrumentUploadCompletedDomainEvent;

    // Act
    await subscriber.on(domainEvent);

    // Assert
    const [command] = commandBus.dispatch.mock.calls[0] ?? [];

    expect(command).toBeInstanceOf(CreateSongInstrumentVideoCommand);
    expect(command).toMatchObject({
      id: domainEvent.aggregateId,
      songInstrumentId: '22345678-1234-4234-8234-123456789012',
      url: 'tracks/from-rabbitmq.mp4',
      duration: 121,
      size: 100001
    });
  });

  it('delegates handlerException to logger.error', () => {
    // Arrange
    const subscriber = new CreateSongInstrumentVideoOnSongInstrumentUploadCompleted(
      'moat.song_instrument_upload.completed',
      logger,
      commandBusResolver
    );
    const exception = new InvalidArgumentException({ message: 'invalid songInstrumentUpload completion payload' });

    // Act
    subscriber.handlerException(exception);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      exception,
      `[CreateSongInstrumentVideoOnSongInstrumentUploadCompleted] Exception handler caught: ${exception.message}`
    );
  });
});
