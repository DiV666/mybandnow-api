import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced } from '../../../../../../src/apps/mybandnow/backend/subscribers/DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced.js';
import { SongInstrumentVideoReplacedDomainEvent } from '../../../../../../src/Contexts/SongInstrument/Video/domain/SongInstrumentVideoReplacedDomainEvent.js';
import { DeletePreviousSongInstrumentVideoCommand } from '../../../../../../src/Contexts/SongInstrument/Video/application/deletePrevious/DeletePreviousSongInstrumentVideoCommand.js';
import type { CommandBus } from '../../../../../../src/Contexts/Shared/domain/CommandBus.js';
import type Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

describe('DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced', () => {
  let logger: MockProxy<Logger>;
  let commandBus: MockProxy<CommandBus>;
  let commandBusResolver: () => CommandBus;

  beforeEach(() => {
    logger = mock<Logger>();
    commandBus = mock<CommandBus>();
    commandBusResolver = vi.fn().mockReturnValue(commandBus);
  });

  it('dispatches DeletePreviousSongInstrumentVideoCommand with replacement payload', async () => {
    // Arrange
    const subscriber = new DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced(
      SongInstrumentVideoReplacedDomainEvent.EVENT_NAME,
      logger,
      commandBusResolver
    );
    const domainEvent = new SongInstrumentVideoReplacedDomainEvent({
      aggregateId: '12345678-1234-4234-8234-123456789012',
      songInstrumentId: '22345678-1234-4234-8234-123456789012',
      oldUrl: 'song-instrument-videos/band-id/song-id/old-process.mp4',
      newUrl: 'song-instrument-videos/band-id/song-id/new-process.mp4'
    });

    // Act
    await subscriber.on(domainEvent);

    // Assert
    expect(commandBusResolver).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledOnce();
    expect(commandBus.dispatch).toHaveBeenCalledWith(expect.any(DeletePreviousSongInstrumentVideoCommand));

    const [command] = commandBus.dispatch.mock.calls[0] ?? [];

    expect(command).toBeInstanceOf(DeletePreviousSongInstrumentVideoCommand);
    expect(command).toMatchObject({
      songInstrumentId: '22345678-1234-4234-8234-123456789012',
      oldUrl: 'song-instrument-videos/band-id/song-id/old-process.mp4',
      newUrl: 'song-instrument-videos/band-id/song-id/new-process.mp4'
    });
  });

  it('dispatches DeletePreviousSongInstrumentVideoCommand when RabbitMQ provides only generic event attributes', async () => {
    // Arrange
    const subscriber = new DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced(
      SongInstrumentVideoReplacedDomainEvent.EVENT_NAME,
      logger,
      commandBusResolver
    );
    const domainEvent = {
      aggregateId: '12345678-1234-4234-8234-123456789012',
      attributes: {
        songInstrumentId: '22345678-1234-4234-8234-123456789012',
        oldUrl: 'song-instrument-videos/band-id/song-id/old-process.mp4',
        newUrl: 'song-instrument-videos/band-id/song-id/new-process.mp4'
      }
    } as unknown as SongInstrumentVideoReplacedDomainEvent;

    // Act
    await subscriber.on(domainEvent);

    // Assert
    const [command] = commandBus.dispatch.mock.calls[0] ?? [];

    expect(command).toBeInstanceOf(DeletePreviousSongInstrumentVideoCommand);
    expect(command).toMatchObject({
      songInstrumentId: '22345678-1234-4234-8234-123456789012',
      oldUrl: 'song-instrument-videos/band-id/song-id/old-process.mp4',
      newUrl: 'song-instrument-videos/band-id/song-id/new-process.mp4'
    });
  });

  it('delegates handlerException to logger.error', () => {
    // Arrange
    const subscriber = new DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced(
      SongInstrumentVideoReplacedDomainEvent.EVENT_NAME,
      logger,
      commandBusResolver
    );
    const exception = new InvalidArgumentException({ message: 'invalid replacement payload' });

    // Act
    subscriber.handlerException(exception);

    // Assert
    expect(logger.error).toHaveBeenCalledWith(
      exception,
      `[DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced] Exception handler caught: ${exception.message}`
    );
  });
});
