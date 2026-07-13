import { DomainEventSubscriber } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { CreateSongInstrumentVideoCommand } from '@Contexts/Moat/SongInstrumentVideo/application/create/CreateSongInstrumentVideoCommand.js';
import { CommandBusResolver } from './ValidateSongInstrumentUploadOnUploadRequested.js';

type SongInstrumentVideoPayload = {
  id: string;
  songInstrumentId: string;
  url: string;
  duration: number;
  size: number;
};

export class CreateSongInstrumentVideoOnSongInstrumentUploadCompleted implements DomainEventSubscriber {
  module = 'CreateSongInstrumentVideoOnSongInstrumentUploadCompleted';

  constructor(
    private readonly routingKey: string,
    private readonly logger: Logger,
    private readonly commandBusResolver: CommandBusResolver
  ) {}

  subscribedTo(): string[] {
    return [this.routingKey];
  }

  async on(domainEvent: DomainEvent): Promise<void> {
    const commandBus = this.commandBusResolver();
    const payload = this.resolvePayload(domainEvent);

    this.logger.info(
      `[CreateSongInstrumentVideoOnSongInstrumentUploadCompleted] Received songInstrumentUpload completion for ${domainEvent.aggregateId}`
    );
    await commandBus.dispatch(
      new CreateSongInstrumentVideoCommand(
        payload.id,
        payload.size,
        payload.duration,
        payload.url,
        payload.songInstrumentId
      )
    );
  }

  private resolvePayload(domainEvent: DomainEvent): SongInstrumentVideoPayload {
    const eventPayload = domainEvent as DomainEvent & {
      songInstrumentId?: unknown;
      url?: unknown;
      duration?: unknown;
      size?: unknown;
    };
    const id = domainEvent.aggregateId;
    const songInstrumentId =
      (typeof eventPayload.songInstrumentId === 'string' ? eventPayload.songInstrumentId : undefined) ??
      (typeof domainEvent.attributes.songInstrumentId === 'string'
        ? domainEvent.attributes.songInstrumentId
        : undefined);
    const url =
      (typeof eventPayload.url === 'string' ? eventPayload.url : undefined) ??
      (typeof domainEvent.attributes.url === 'string' ? domainEvent.attributes.url : undefined);
    const duration =
      (typeof eventPayload.duration === 'number' ? eventPayload.duration : undefined) ??
      (typeof domainEvent.attributes.duration === 'number' ? domainEvent.attributes.duration : undefined);
    const size =
      (typeof eventPayload.size === 'number' ? eventPayload.size : undefined) ??
      (typeof domainEvent.attributes.size === 'number' ? domainEvent.attributes.size : undefined);

    if (
      typeof songInstrumentId !== 'string' ||
      songInstrumentId.length === 0 ||
      typeof url !== 'string' ||
      url.length === 0 ||
      typeof duration !== 'number' ||
      typeof size !== 'number'
    ) {
      throw new InvalidArgumentException({
        message: 'SongInstrumentUpload completed event is missing a valid songInstrumentId, url, duration, or size'
      });
    }

    return { id, songInstrumentId, url, duration, size };
  }

  handlerException(ex: Exception): void {
    this.logger.error(
      ex,
      `[CreateSongInstrumentVideoOnSongInstrumentUploadCompleted] Exception handler caught: ${ex.message}`
    );
  }
}
