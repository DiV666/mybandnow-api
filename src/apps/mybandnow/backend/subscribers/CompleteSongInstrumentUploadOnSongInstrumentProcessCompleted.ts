import { DomainEventSubscriber } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { SongInstrumentUploadUpdateStatusCommand } from '@Contexts/Moat/SongInstrumentUpload/application/updateStatus/SongInstrumentUploadUpdateStatusCommand.js';
import { CommandBusResolver } from './ValidateSongInstrumentUploadOnUploadRequested.js';

export class CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted implements DomainEventSubscriber {
  module = 'CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted';

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
    const completionData = this.resolveCompletionData(domainEvent);

    this.logger.info(
      `[CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted] Received song instrument process completion for ${domainEvent.aggregateId}`
    );
    await commandBus.dispatch(
      new SongInstrumentUploadUpdateStatusCommand(domainEvent.aggregateId, 'COMPLETED', completionData)
    );
  }

  private resolveCompletionData(domainEvent: DomainEvent): {
    url: string;
    duration: number;
    size: number;
  } {
    const eventPayload = domainEvent as DomainEvent & {
      url?: unknown;
      duration?: unknown;
      size?: unknown;
    };
    const url =
      (typeof eventPayload.url === 'string' ? eventPayload.url : undefined) ??
      (typeof domainEvent.attributes.url === 'string' ? domainEvent.attributes.url : undefined);
    const duration =
      (typeof eventPayload.duration === 'number' ? eventPayload.duration : undefined) ??
      (typeof domainEvent.attributes.duration === 'number' ? domainEvent.attributes.duration : undefined);
    const size =
      (typeof eventPayload.size === 'number' ? eventPayload.size : undefined) ??
      (typeof domainEvent.attributes.size === 'number' ? domainEvent.attributes.size : undefined);

    if (typeof url !== 'string' || url.length === 0 || typeof duration !== 'number' || typeof size !== 'number') {
      throw new InvalidArgumentException({
        message: 'Song instrument process completed event is missing a valid url, duration, or size'
      });
    }

    return {
      url,
      duration,
      size
    };
  }

  handlerException(ex: Exception): void {
    this.logger.error(
      ex,
      `[CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted] Exception handler caught: ${ex.message}`
    );
  }
}
