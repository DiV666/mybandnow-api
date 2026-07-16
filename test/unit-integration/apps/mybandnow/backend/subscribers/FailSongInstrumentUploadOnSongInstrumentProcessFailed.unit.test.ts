import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { FailSongInstrumentUploadOnSongInstrumentProcessFailed } from '../../../../../../src/apps/mybandnow/backend/subscribers/FailSongInstrumentUploadOnSongInstrumentProcessFailed.js';
import { SongInstrumentProcessFailedDomainEvent } from '../../../../../../src/Contexts/Orchestrator/SongInstrumentProcess/domain/SongInstrumentProcessFailedDomainEvent.js';
import { SongInstrumentUploadUpdateStatusCommand } from '../../../../../../src/Contexts/Moat/SongInstrumentUpload/application/updateStatus/SongInstrumentUploadUpdateStatusCommand.js';
import { SongInstrumentUploadStatusValues } from '../../../../../../src/Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadStatus.js';
import type { CommandBus } from '../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

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
      'orchestrator.song_instrument_process.failed',
      logger,
      commandBusResolver
    );
    const domainEvent = new SongInstrumentProcessFailedDomainEvent({
      aggregateId: '12345678-1234-4234-8234-123456789012'
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
      completionData: undefined
    });
  });

  it('delegates handlerException to logger.error', () => {
    // Arrange
    const subscriber = new FailSongInstrumentUploadOnSongInstrumentProcessFailed(
      'orchestrator.song_instrument_process.failed',
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
