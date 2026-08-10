import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { EnrichSongOriginalVideoClipDurationOnSongCreated } from '../../../../../../src/apps/mybandnow/backend/subscribers/EnrichSongOriginalVideoClipDurationOnSongCreated.js';
import { SongCreatedDomainEvent } from '../../../../../../src/Contexts/Song/domain/SongCreatedDomainEvent.js';
import { EnrichSongOriginalVideoClipDurationCommand } from '../../../../../../src/Contexts/Song/application/enrichOriginalVideoClipDuration/EnrichSongOriginalVideoClipDurationCommand.js';
import type { CommandBus } from '../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('EnrichSongOriginalVideoClipDurationOnSongCreated', () => {
  let logger: MockProxy<Logger>;
  let commandBus: MockProxy<CommandBus>;
  let commandBusResolver: () => CommandBus;

  beforeEach(() => {
    logger = mock<Logger>();
    commandBus = mock<CommandBus>();
    commandBusResolver = vi.fn().mockReturnValue(commandBus);
  });

  it('dispatches EnrichSongOriginalVideoClipDurationCommand with the song id and original videoclip url', async () => {
    // Arrange
    const subscriber = new EnrichSongOriginalVideoClipDurationOnSongCreated(
      SongCreatedDomainEvent.EVENT_NAME,
      logger,
      commandBusResolver
    );
    const domainEvent = new SongCreatedDomainEvent({
      aggregateId: '12345678-1234-4234-8234-123456789012',
      bandId: '22345678-1234-4234-8234-123456789012',
      title: 'Road to Green',
      originalVideoclipUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    });

    // Act
    await subscriber.on(domainEvent);

    // Assert
    expect(commandBusResolver).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledExactlyOnceWith(
      new EnrichSongOriginalVideoClipDurationCommand(
        '12345678-1234-4234-8234-123456789012',
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      )
    );
  });

  it('dispatches the command when RabbitMQ provides only generic event attributes', async () => {
    // Arrange
    const subscriber = new EnrichSongOriginalVideoClipDurationOnSongCreated(
      SongCreatedDomainEvent.EVENT_NAME,
      logger,
      commandBusResolver
    );
    const domainEvent = {
      aggregateId: '12345678-1234-4234-8234-123456789012',
      attributes: {
        originalVideoclipUrl: 'https://youtu.be/dQw4w9WgXcQ'
      }
    } as unknown as SongCreatedDomainEvent;

    // Act
    await subscriber.on(domainEvent);

    // Assert
    expect(commandBus.dispatch).toHaveBeenCalledExactlyOnceWith(
      new EnrichSongOriginalVideoClipDurationCommand(
        '12345678-1234-4234-8234-123456789012',
        'https://youtu.be/dQw4w9WgXcQ'
      )
    );
  });

  it('delegates handlerException to logger.error', () => {
    // Arrange
    const subscriber = new EnrichSongOriginalVideoClipDurationOnSongCreated(
      SongCreatedDomainEvent.EVENT_NAME,
      logger,
      commandBusResolver
    );
    const exception = new InvalidArgumentException({ message: 'invalid song created payload' });

    // Act
    subscriber.handlerException(exception);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      exception,
      `[EnrichSongOriginalVideoClipDurationOnSongCreated] Exception handler caught: ${exception.message}`
    );
  });
});
