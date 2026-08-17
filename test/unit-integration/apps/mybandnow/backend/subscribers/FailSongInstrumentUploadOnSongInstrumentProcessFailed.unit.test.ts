import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { FailSongInstrumentUploadOnSongInstrumentProcessFailed } from '../../../../../../src/apps/mybandnow/backend/subscribers/FailSongInstrumentUploadOnSongInstrumentProcessFailed.js';
import { SongInstrumentProcessFailedDomainEvent } from '../../../../../../src/Contexts/Orchestrator/SongInstrumentProcess/domain/SongInstrumentProcessFailedDomainEvent.js';
import { SongInstrumentUploadUpdateStatusCommand } from '../../../../../../src/Contexts/SongInstrument/Upload/application/updateStatus/SongInstrumentUploadUpdateStatusCommand.js';
import { SongInstrumentUploadStatusValues } from '../../../../../../src/Contexts/SongInstrument/Upload/domain/value-object/SongInstrumentUploadStatus.js';
import type { CommandBus } from '../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { SongInstrumentUploadNotExistException } from '../../../../../../src/Contexts/SongInstrument/Upload/domain/exception/SongInstrumentUploadNotExistException.js';
import { NonRetryableException } from '../../../../../../src/Contexts/Shared/domain/exceptions/NonRetryableException.js';

describe('FailSongInstrumentUploadOnSongInstrumentProcessFailed', () => {
  let logger: MockProxy<Logger>;
  let commandBus: MockProxy<CommandBus>;
  let commandBusResolver: () => CommandBus;

  beforeEach(() => {
    logger = mock<Logger>();
    commandBus = mock<CommandBus>();
    commandBusResolver = vi.fn().mockReturnValue(commandBus);
  });

  it('dispatches SongInstrumentUploadUpdateStatusCommand with FAILED status when the technical process fails', async () => {
    // Arrange
    const subscriber = new FailSongInstrumentUploadOnSongInstrumentProcessFailed(
      'orchestrator.1.song_instrument_process.failed',
      logger,
      commandBusResolver
    );
    const domainEvent = new SongInstrumentProcessFailedDomainEvent({
      aggregateId: '12345678-1234-4234-8234-123456789012',
      publicErrorMessage: 'The uploaded video must use H.264 codec.',
      publicErrorCode: 'UNSUPPORTED_CODEC'
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
      status: SongInstrumentUploadStatusValues.FAILED,
      completionData: undefined,
      errorMessage: 'The uploaded video must use H.264 codec.',
      errorCode: 'UNSUPPORTED_CODEC'
    });
  });

  it('routes missing upload attempts to dead-letter without retry', () => {
    // Arrange
    const subscriber = new FailSongInstrumentUploadOnSongInstrumentProcessFailed(
      'orchestrator.1.song_instrument_process.failed',
      logger,
      commandBusResolver
    );
    const exception = new SongInstrumentUploadNotExistException('12345678-1234-4234-8234-123456789012');

    // Act / Assert
    expect(() => subscriber.handlerException(exception)).toThrow(NonRetryableException);
    expect(logger.warn).toHaveBeenCalledWith(
      { code: exception.code },
      '[FailSongInstrumentUploadOnSongInstrumentProcessFailed] Upload attempt no longer exists; routing stale failure event to dead-letter without retry.'
    );
  });

  it('delegates handlerException to logger.error', () => {
    // Arrange
    const subscriber = new FailSongInstrumentUploadOnSongInstrumentProcessFailed(
      'orchestrator.1.song_instrument_process.failed',
      logger,
      commandBusResolver
    );
    const exception = new InvalidArgumentException({ message: 'invalid technical failure payload' });

    // Act
    subscriber.handlerException(exception);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      exception,
      `[FailSongInstrumentUploadOnSongInstrumentProcessFailed] Exception handler caught: ${exception.message}`
    );
  });
});
