import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { ValidateTrackOnUploadRequested } from '../../../../../../src/apps/mybandnow/backend/subscribers/ValidateTrackOnUploadRequested.js';
import { TrackUploadRequestedDomainEvent } from '../../../../../../src/Contexts/Moat/Track/domain/TrackUploadRequestedDomainEvent.js';
import { TrackProcessValidateCommand } from '../../../../../../src/Contexts/Orchestrator/TrackProcess/application/TrackProcessValidateCommand.js';
import type { CommandBus } from '../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('ValidateTrackOnUploadRequested', () => {
  let logger: MockProxy<Logger>;
  let commandBus: MockProxy<CommandBus>;
  let commandBusResolver: () => CommandBus;

  beforeEach(() => {
    logger = mock<Logger>();
    commandBus = mock<CommandBus>();
    commandBusResolver = vi.fn().mockReturnValue(commandBus);
  });

  it('dispatches TrackProcessValidateCommand with aggregateId and fileReference from the domain event', async () => {
    // Arrange
    const subscriber = new ValidateTrackOnUploadRequested('moat.track.upload_requested', logger, commandBusResolver);
    const domainEvent = new TrackUploadRequestedDomainEvent({
      aggregateId: '12345678-1234-4234-8234-123456789012',
      fileReference: 'uploads/track.mp4'
    });

    // Act
    await subscriber.on(domainEvent);

    // Assert
    expect(commandBusResolver).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledWith(expect.any(TrackProcessValidateCommand));

    const [command] = commandBus.dispatch.mock.calls[0] ?? [];

    expect(command).toBeInstanceOf(TrackProcessValidateCommand);
    expect(command).toMatchObject({
      aggregateId: domainEvent.aggregateId,
      fileReference: domainEvent.fileReference
    });
  });

  it('dispatches TrackProcessValidateCommand when RabbitMQ provides only generic event attributes', async () => {
    // Arrange
    const subscriber = new ValidateTrackOnUploadRequested('moat.track.upload_requested', logger, commandBusResolver);
    const domainEvent = {
      aggregateId: '12345678-1234-4234-8234-123456789012',
      attributes: {
        fileReference: 'uploads/from-rabbitmq.mp4'
      }
    } as unknown as TrackUploadRequestedDomainEvent;

    // Act
    await subscriber.on(domainEvent);

    // Assert
    const [command] = commandBus.dispatch.mock.calls[0] ?? [];

    expect(command).toBeInstanceOf(TrackProcessValidateCommand);
    expect(command).toMatchObject({
      aggregateId: domainEvent.aggregateId,
      fileReference: 'uploads/from-rabbitmq.mp4'
    });
  });

  it('delegates handlerException to logger.error', () => {
    // Arrange
    const subscriber = new ValidateTrackOnUploadRequested('moat.track.upload_requested', logger, commandBusResolver);
    const exception = new InvalidArgumentException({ message: 'invalid track payload' });

    // Act
    subscriber.handlerException(exception);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      exception,
      `[ValidateTrackOnUploadRequested] Exception handler caught: ${exception.message}`
    );
  });
});
