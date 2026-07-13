import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted } from '../../../../../../src/apps/mybandnow/backend/subscribers/CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted.js';
import { SongInstrumentProcessCompletedDomainEvent } from '../../../../../../src/Contexts/Orchestrator/SongInstrumentProcess/domain/SongInstrumentProcessCompletedDomainEvent.js';
import { SongInstrumentUploadUpdateStatusCommand } from '../../../../../../src/Contexts/Moat/SongInstrumentUpload/application/updateStatus/SongInstrumentUploadUpdateStatusCommand.js';
import { SongInstrumentUploadStatusValues } from '../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadStatus.js';
import type { CommandBus } from '../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted', () => {
  let logger: MockProxy<Logger>;
  let commandBus: MockProxy<CommandBus>;
  let commandBusResolver: () => CommandBus;

  beforeEach(() => {
    logger = mock<Logger>();
    commandBus = mock<CommandBus>();
    commandBusResolver = vi.fn().mockReturnValue(commandBus);
  });

  it('dispatches SongInstrumentUploadUpdateStatusCommand with completion payload from the technical process event', async () => {
    // Arrange
    const subscriber = new CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted(
      'orchestrator.song_instrument_process.completed',
      logger,
      commandBusResolver
    );
    const domainEvent = new SongInstrumentProcessCompletedDomainEvent({
      aggregateId: '12345678-1234-4234-8234-123456789012',
      url: 'tracks/12345678-1234-4234-8234-123456789012.mp4',
      duration: 120,
      size: 100000
    });

    // Act
    await subscriber.on(domainEvent);

    // Assert
    expect(commandBusResolver).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledWith(expect.any(SongInstrumentUploadUpdateStatusCommand));

    const [command] = commandBus.dispatch.mock.calls[0] ?? [];

    expect(command).toBeInstanceOf(SongInstrumentUploadUpdateStatusCommand);
    expect(command).toMatchObject({
      id: domainEvent.aggregateId,
      status: SongInstrumentUploadStatusValues.COMPLETED,
      completionData: {
        url: 'tracks/12345678-1234-4234-8234-123456789012.mp4',
        duration: 120,
        size: 100000
      }
    });
  });

  it('dispatches SongInstrumentUploadUpdateStatusCommand when RabbitMQ provides only generic event attributes', async () => {
    // Arrange
    const subscriber = new CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted(
      'orchestrator.song_instrument_process.completed',
      logger,
      commandBusResolver
    );
    const domainEvent = {
      aggregateId: '12345678-1234-4234-8234-123456789012',
      attributes: {
        url: 'tracks/from-rabbitmq.mp4',
        duration: 121,
        size: 100001
      }
    } as unknown as SongInstrumentProcessCompletedDomainEvent;

    // Act
    await subscriber.on(domainEvent);

    // Assert
    const [command] = commandBus.dispatch.mock.calls[0] ?? [];

    expect(command).toBeInstanceOf(SongInstrumentUploadUpdateStatusCommand);
    expect(command).toMatchObject({
      id: domainEvent.aggregateId,
      status: SongInstrumentUploadStatusValues.COMPLETED,
      completionData: {
        url: 'tracks/from-rabbitmq.mp4',
        duration: 121,
        size: 100001
      }
    });
  });

  it('delegates handlerException to logger.error', () => {
    // Arrange
    const subscriber = new CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted(
      'orchestrator.song_instrument_process.completed',
      logger,
      commandBusResolver
    );
    const exception = new InvalidArgumentException({ message: 'invalid technical completion payload' });

    // Act
    subscriber.handlerException(exception);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      exception,
      `[CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted] Exception handler caught: ${exception.message}`
    );
  });
});
