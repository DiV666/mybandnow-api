import { DomainEventSubscriber } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import { SongInstrumentUploadUpdateStatusCommand } from '@Contexts/SongInstrument/Upload/application/updateStatus/SongInstrumentUploadUpdateStatusCommand.js';
import { SongInstrumentUploadStatusValues } from '@Contexts/SongInstrument/Upload/domain/value-object/SongInstrumentUploadStatus.js';
import { SongInstrumentUploadErrorCodeValues } from '@Contexts/SongInstrument/Upload/domain/value-object/SongInstrumentUploadErrorCode.js';
import { SongInstrumentUploadNotExistException } from '@Contexts/SongInstrument/Upload/domain/exception/SongInstrumentUploadNotExistException.js';
import { NonRetryableException } from '@Contexts/Shared/domain/exceptions/NonRetryableException.js';
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
    const publicErrorMessage =
      typeof domainEvent.attributes.publicErrorMessage === 'string' &&
      domainEvent.attributes.publicErrorMessage.length > 0
        ? domainEvent.attributes.publicErrorMessage
        : 'The uploaded video could not be processed. Please try again.';

    const publicErrorCode =
      typeof domainEvent.attributes.publicErrorCode === 'string' &&
      (Object.values(SongInstrumentUploadErrorCodeValues) as string[]).includes(domainEvent.attributes.publicErrorCode)
        ? domainEvent.attributes.publicErrorCode
        : SongInstrumentUploadErrorCodeValues.PROCESSING_FAILED;

    await commandBus.dispatch(
      new SongInstrumentUploadUpdateStatusCommand(
        domainEvent.aggregateId,
        SongInstrumentUploadStatusValues.FAILED,
        undefined,
        publicErrorMessage,
        publicErrorCode
      )
    );
  }

  handlerException(ex: Exception): void {
    if (ex instanceof SongInstrumentUploadNotExistException) {
      this.logger.warn(
        { code: ex.code },
        '[FailSongInstrumentUploadOnSongInstrumentProcessFailed] Upload attempt no longer exists; routing stale failure event to dead-letter without retry.'
      );
      throw new NonRetryableException(ex);
    }

    this.logger.error(
      ex,
      `[FailSongInstrumentUploadOnSongInstrumentProcessFailed] Exception handler caught: ${ex.message}`
    );
  }
}
