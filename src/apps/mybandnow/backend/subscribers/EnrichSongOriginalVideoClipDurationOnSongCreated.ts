import { DomainEventSubscriber } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import type { CommandBus } from '@Contexts/Shared/domain/CommandBus.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { EnrichSongOriginalVideoClipDurationCommand } from '@Contexts/Song/application/enrichOriginalVideoClipDuration/EnrichSongOriginalVideoClipDurationCommand.js';

export type CommandBusResolver = () => CommandBus;

export class EnrichSongOriginalVideoClipDurationOnSongCreated implements DomainEventSubscriber {
  module = 'EnrichSongOriginalVideoClipDurationOnSongCreated';

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
    const originalVideoclipUrl = this.resolveOriginalVideoclipUrl(domainEvent);

    this.logger.info(
      `[EnrichSongOriginalVideoClipDurationOnSongCreated] Received song creation for ${domainEvent.aggregateId}`
    );
    await commandBus.dispatch(
      new EnrichSongOriginalVideoClipDurationCommand(domainEvent.aggregateId, originalVideoclipUrl)
    );
  }

  private resolveOriginalVideoclipUrl(domainEvent: DomainEvent): string {
    const eventPayload = domainEvent as DomainEvent & { originalVideoclipUrl?: unknown };
    const originalVideoclipUrl =
      (typeof eventPayload.originalVideoclipUrl === 'string' ? eventPayload.originalVideoclipUrl : undefined) ??
      (typeof domainEvent.attributes.originalVideoclipUrl === 'string'
        ? domainEvent.attributes.originalVideoclipUrl
        : undefined);

    if (typeof originalVideoclipUrl !== 'string' || originalVideoclipUrl.length === 0) {
      throw new InvalidArgumentException({ message: 'Song created event is missing a valid originalVideoclipUrl' });
    }

    return originalVideoclipUrl;
  }

  handlerException(ex: Exception): void {
    this.logger.error(ex, `[EnrichSongOriginalVideoClipDurationOnSongCreated] Exception handler caught: ${ex.message}`);
  }
}
