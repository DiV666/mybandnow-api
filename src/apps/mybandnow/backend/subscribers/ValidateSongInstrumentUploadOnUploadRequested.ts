import { DomainEventSubscriber } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import type { CommandBus } from '@Contexts/Shared/domain/CommandBus.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { SongInstrumentProcessValidateCommand } from '@Contexts/Orchestrator/SongInstrumentProcess/application/SongInstrumentProcessValidateCommand.js';
import { SongPersistenceRepository } from '@Contexts/Song/domain/repository/SongPersistenceRepository.js';
import { SongId } from '@Contexts/Song/domain/value-object/SongId.js';

export type CommandBusResolver = () => CommandBus;

export class ValidateSongInstrumentUploadOnUploadRequested implements DomainEventSubscriber {
  module = 'ValidateSongInstrumentUploadOnUploadRequested';

  constructor(
    private readonly routingKey: string,
    private readonly logger: Logger,
    private readonly commandBusResolver: CommandBusResolver,
    private readonly songRepository: SongPersistenceRepository
  ) {}

  subscribedTo(): string[] {
    return [this.routingKey];
  }

  async on(domainEvent: DomainEvent): Promise<void> {
    const { aggregateId } = domainEvent;
    const payload = this.resolvePayload(domainEvent);
    const commandBus = this.commandBusResolver();

    this.logger.info(
      `[ValidateSongInstrumentUploadOnUploadRequested] Received song instrument upload request for ${aggregateId}`
    );

    const song = await this.songRepository.search(new SongId(payload.songId));

    if (!song) {
      throw new InvalidArgumentException({
        message: `Song ${payload.songId} not found while processing upload ${aggregateId}`
      });
    }

    await commandBus.dispatch(
      new SongInstrumentProcessValidateCommand(
        aggregateId,
        payload.fileReference,
        payload.songId,
        payload.songInstrumentId,
        song.bandId.value
      )
    );
  }

  private resolvePayload(domainEvent: DomainEvent): {
    fileReference: string;
    songId: string;
    songInstrumentId: string;
  } {
    const eventPayload = domainEvent as DomainEvent & {
      fileReference?: unknown;
      songId?: unknown;
      songInstrumentId?: unknown;
    };
    const fileReference =
      (typeof eventPayload.fileReference === 'string' ? eventPayload.fileReference : undefined) ??
      (typeof domainEvent.attributes.fileReference === 'string' ? domainEvent.attributes.fileReference : undefined);
    const songId =
      (typeof eventPayload.songId === 'string' ? eventPayload.songId : undefined) ??
      (typeof domainEvent.attributes.songId === 'string' ? domainEvent.attributes.songId : undefined);
    const songInstrumentId =
      (typeof eventPayload.songInstrumentId === 'string' ? eventPayload.songInstrumentId : undefined) ??
      (typeof domainEvent.attributes.songInstrumentId === 'string'
        ? domainEvent.attributes.songInstrumentId
        : undefined);

    if (
      typeof fileReference !== 'string' ||
      fileReference.length === 0 ||
      typeof songId !== 'string' ||
      songId.length === 0 ||
      typeof songInstrumentId !== 'string' ||
      songInstrumentId.length === 0
    ) {
      throw new InvalidArgumentException({
        message: 'SongInstrumentUpload upload event is missing a valid fileReference, songId, or songInstrumentId'
      });
    }

    return { fileReference, songId, songInstrumentId };
  }

  handlerException(ex: Exception): void {
    this.logger.error(ex, `[ValidateSongInstrumentUploadOnUploadRequested] Exception handler caught: ${ex.message}`);
  }
}
