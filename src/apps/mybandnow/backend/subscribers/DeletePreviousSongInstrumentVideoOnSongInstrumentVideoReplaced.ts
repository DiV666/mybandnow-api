import { DomainEventSubscriber } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import type { CommandBus } from '@Contexts/Shared/domain/CommandBus.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { DeletePreviousSongInstrumentVideoCommand } from '@Contexts/Moat/SongInstrumentVideo/application/deletePrevious/DeletePreviousSongInstrumentVideoCommand.js';

type ReplacementPayload = {
  songInstrumentId: string;
  oldUrl: string;
  newUrl: string;
};

export type CommandBusResolver = () => CommandBus;

export class DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced implements DomainEventSubscriber {
  module = 'DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced';

  constructor(
    private readonly routingKey: string,
    private readonly logger: Logger,
    private readonly commandBusResolver: CommandBusResolver
  ) {}

  subscribedTo(): string[] {
    return [this.routingKey];
  }

  async on(domainEvent: DomainEvent): Promise<void> {
    const payload = this.resolvePayload(domainEvent);
    const commandBus = this.commandBusResolver();

    await commandBus.dispatch(
      new DeletePreviousSongInstrumentVideoCommand(payload.songInstrumentId, payload.oldUrl, payload.newUrl)
    );
  }

  private resolvePayload(domainEvent: DomainEvent): ReplacementPayload {
    const songInstrumentId = domainEvent.attributes.songInstrumentId;
    const oldUrl = domainEvent.attributes.oldUrl;
    const newUrl = domainEvent.attributes.newUrl;

    if (
      typeof songInstrumentId !== 'string' ||
      songInstrumentId.length === 0 ||
      typeof oldUrl !== 'string' ||
      oldUrl.length === 0 ||
      typeof newUrl !== 'string' ||
      newUrl.length === 0
    ) {
      throw new InvalidArgumentException({
        message: 'SongInstrumentVideo replaced event is missing a valid songInstrumentId, oldUrl, or newUrl'
      });
    }

    return { songInstrumentId, oldUrl, newUrl };
  }

  handlerException(ex: Exception): void {
    this.logger.error(
      ex,
      `[DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced] Exception handler caught: ${ex.message}`
    );
  }
}
