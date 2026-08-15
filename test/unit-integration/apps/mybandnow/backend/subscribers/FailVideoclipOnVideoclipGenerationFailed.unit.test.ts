import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { FailVideoclipOnVideoclipGenerationFailed } from '../../../../../../src/apps/mybandnow/backend/subscribers/FailVideoclipOnVideoclipGenerationFailed.js';
import { DomainEvent } from '../../../../../../src/Contexts/Shared/domain/DomainEvent.js';
import { FailVideoclipCommand } from '../../../../../../src/Contexts/Orchestrator/VideoclipProcess/application/fail/FailVideoclipCommand.js';
import type { CommandBus } from '../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

const PROCESS_ID = '12345678-1234-4234-8234-123456789012';
const ROUTING_KEY = 'videoclip_worker.1.videoclip_generation.failed';

class VideoclipGenerationFailedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = ROUTING_KEY;
  readonly attributes: Record<string, unknown>;

  constructor(aggregateId: string, attributes: Record<string, unknown>) {
    super({ eventName: VideoclipGenerationFailedDomainEvent.EVENT_NAME, aggregateId });
    this.attributes = attributes;
  }
}

describe('FailVideoclipOnVideoclipGenerationFailed', () => {
  let logger: MockProxy<Logger>;
  let commandBus: MockProxy<CommandBus>;
  let commandBusResolver: () => CommandBus;

  beforeEach(() => {
    logger = mock<Logger>();
    commandBus = mock<CommandBus>();
    commandBusResolver = vi.fn().mockReturnValue(commandBus);
  });

  it('dispatches FailVideoclipCommand with the processId, errorCode, errorMessage and failedPhase', async () => {
    // Arrange
    const subscriber = new FailVideoclipOnVideoclipGenerationFailed(ROUTING_KEY, logger, commandBusResolver);
    const domainEvent = new VideoclipGenerationFailedDomainEvent(PROCESS_ID, {
      songId: '22345678-1234-4234-8234-123456789012',
      failedPhase: 'RENDERING_CLIPS',
      errorCode: 'CLIP_RENDER_FAILED',
      errorMessage: 'Rendering timed out',
      failedAt: new Date().toISOString()
    });

    // Act
    await subscriber.on(domainEvent);

    // Assert
    expect(commandBusResolver).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledWith(expect.any(FailVideoclipCommand));

    const [command] = commandBus.dispatch.mock.calls[0] ?? [];

    expect(command).toBeInstanceOf(FailVideoclipCommand);
    expect(command).toMatchObject({
      processId: PROCESS_ID,
      errorCode: 'CLIP_RENDER_FAILED',
      errorMessage: 'Rendering timed out',
      failedPhase: 'RENDERING_CLIPS'
    });
  });

  it('throws InvalidArgumentException when errorCode, errorMessage or failedPhase is missing', async () => {
    // Arrange
    const subscriber = new FailVideoclipOnVideoclipGenerationFailed(ROUTING_KEY, logger, commandBusResolver);
    const domainEvent = new VideoclipGenerationFailedDomainEvent(PROCESS_ID, {
      songId: '22345678-1234-4234-8234-123456789012',
      errorCode: 'CLIP_RENDER_FAILED'
    });

    // Act / Assert
    await expect(subscriber.on(domainEvent)).rejects.toThrow(InvalidArgumentException);
    expect(commandBus.dispatch).not.toHaveBeenCalled();
  });

  it('exposes the routing key it subscribes to', () => {
    const subscriber = new FailVideoclipOnVideoclipGenerationFailed(ROUTING_KEY, logger, commandBusResolver);

    expect(subscriber.subscribedTo()).toEqual([ROUTING_KEY]);
  });

  it('delegates handlerException to logger.error', () => {
    // Arrange
    const subscriber = new FailVideoclipOnVideoclipGenerationFailed(ROUTING_KEY, logger, commandBusResolver);
    const exception = new InvalidArgumentException({ message: 'invalid failure payload' });

    // Act
    subscriber.handlerException(exception);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      exception,
      `[FailVideoclipOnVideoclipGenerationFailed] Exception handler caught: ${exception.message}`
    );
  });
});
