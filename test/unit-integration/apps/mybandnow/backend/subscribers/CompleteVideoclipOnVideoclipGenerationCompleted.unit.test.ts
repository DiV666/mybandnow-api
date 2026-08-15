import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { CompleteVideoclipOnVideoclipGenerationCompleted } from '../../../../../../src/apps/mybandnow/backend/subscribers/CompleteVideoclipOnVideoclipGenerationCompleted.js';
import { DomainEvent } from '../../../../../../src/Contexts/Shared/domain/DomainEvent.js';
import { CompleteVideoclipCommand } from '../../../../../../src/Contexts/Orchestrator/VideoclipProcess/application/complete/CompleteVideoclipCommand.js';
import type { CommandBus } from '../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

const PROCESS_ID = '12345678-1234-4234-8234-123456789012';
const ROUTING_KEY = 'videoclip_worker.1.videoclip_generation.completed';

class VideoclipGenerationCompletedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = ROUTING_KEY;
  readonly attributes: Record<string, unknown>;

  constructor(aggregateId: string, attributes: Record<string, unknown>) {
    super({ eventName: VideoclipGenerationCompletedDomainEvent.EVENT_NAME, aggregateId });
    this.attributes = attributes;
  }
}

describe('CompleteVideoclipOnVideoclipGenerationCompleted', () => {
  let logger: MockProxy<Logger>;
  let commandBus: MockProxy<CommandBus>;
  let commandBusResolver: () => CommandBus;

  beforeEach(() => {
    logger = mock<Logger>();
    commandBus = mock<CommandBus>();
    commandBusResolver = vi.fn().mockReturnValue(commandBus);
  });

  it('dispatches CompleteVideoclipCommand with the processId and finalVideoGcsPath', async () => {
    // Arrange
    const subscriber = new CompleteVideoclipOnVideoclipGenerationCompleted(ROUTING_KEY, logger, commandBusResolver);
    const domainEvent = new VideoclipGenerationCompletedDomainEvent(PROCESS_ID, {
      songId: '22345678-1234-4234-8234-123456789012',
      finalVideoGcsPath: 'songs/final/video.mp4',
      completedAt: new Date().toISOString()
    });

    // Act
    await subscriber.on(domainEvent);

    // Assert
    expect(commandBusResolver).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledWith(expect.any(CompleteVideoclipCommand));

    const [command] = commandBus.dispatch.mock.calls[0] ?? [];

    expect(command).toBeInstanceOf(CompleteVideoclipCommand);
    expect(command).toMatchObject({
      processId: PROCESS_ID,
      finalVideoGcsPath: 'songs/final/video.mp4'
    });
  });

  it('throws InvalidArgumentException when finalVideoGcsPath is missing', async () => {
    // Arrange
    const subscriber = new CompleteVideoclipOnVideoclipGenerationCompleted(ROUTING_KEY, logger, commandBusResolver);
    const domainEvent = new VideoclipGenerationCompletedDomainEvent(PROCESS_ID, {
      songId: '22345678-1234-4234-8234-123456789012'
    });

    // Act / Assert
    await expect(subscriber.on(domainEvent)).rejects.toThrow(InvalidArgumentException);
    expect(commandBus.dispatch).not.toHaveBeenCalled();
  });

  it('exposes the routing key it subscribes to', () => {
    const subscriber = new CompleteVideoclipOnVideoclipGenerationCompleted(ROUTING_KEY, logger, commandBusResolver);

    expect(subscriber.subscribedTo()).toEqual([ROUTING_KEY]);
  });

  it('delegates handlerException to logger.error', () => {
    // Arrange
    const subscriber = new CompleteVideoclipOnVideoclipGenerationCompleted(ROUTING_KEY, logger, commandBusResolver);
    const exception = new InvalidArgumentException({ message: 'invalid completion payload' });

    // Act
    subscriber.handlerException(exception);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      exception,
      `[CompleteVideoclipOnVideoclipGenerationCompleted] Exception handler caught: ${exception.message}`
    );
  });
});
