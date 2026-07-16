import { DomainEventSubscriber } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import { SongInstrumentUploadUpdateStatusCommand } from '@Contexts/Moat/SongInstrumentUpload/application/updateStatus/SongInstrumentUploadUpdateStatusCommand.js';
import { SongInstrumentUploadStatusValues } from '@Contexts/Moat/SongInstrumentUpload/domain/value-object/SongInstrumentUploadStatus.js';
import { CommandBusResolver } from './ValidateSongInstrumentUploadOnUploadRequested.js';

export class FailSongInstrumentUploadOnSongInstrumentProcessFailed implements DomainEventSubscriber {
  module = 'FailSongInstrumentUploadOnSongInstrumentProcessFailed';

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

    this.logger.info(
      `[FailSongInstrumentUploadOnSongInstrumentProcessFailed] Received song instrument process failure for ${domainEvent.aggregateId}`
    );
    await commandBus.dispatch(
      new SongInstrumentUploadUpdateStatusCommand(domainEvent.aggregateId, SongInstrumentUploadStatusValues.FAILED)
    );
  }

  handlerException(ex: Exception): void {
    this.logger.error(
      ex,
      `[FailSongInstrumentUploadOnSongInstrumentProcessFailed] Exception handler caught: ${ex.message}`
    );
  }
}
