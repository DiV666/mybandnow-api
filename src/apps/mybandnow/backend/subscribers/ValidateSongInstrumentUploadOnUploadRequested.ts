import { DomainEventSubscriber } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import type { CommandBus } from '@Contexts/Shared/domain/CommandBus.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { SongInstrumentProcessValidateCommand } from '@Contexts/Orchestrator/SongInstrumentProcess/application/SongInstrumentProcessValidateCommand.js';

export type CommandBusResolver = () => CommandBus;

export class ValidateSongInstrumentUploadOnUploadRequested implements DomainEventSubscriber {
  module = 'ValidateSongInstrumentUploadOnUploadRequested';

  constructor(
    private readonly routingKey: string,
    private readonly logger: Logger,
    private readonly commandBusResolver: CommandBusResolver
  ) {}

  subscribedTo(): string[] {
    return [this.routingKey];
  }

  async on(domainEvent: DomainEvent): Promise<void> {
    const { aggregateId } = domainEvent;
    const fileReference = this.resolveFileReference(domainEvent);
    const commandBus = this.commandBusResolver();

    this.logger.info(
      `[ValidateSongInstrumentUploadOnUploadRequested] Received song instrument upload request for ${aggregateId}`
    );
    await commandBus.dispatch(new SongInstrumentProcessValidateCommand(aggregateId, fileReference));
  }

  private resolveFileReference(domainEvent: DomainEvent): string {
    const eventPayload = domainEvent as DomainEvent & { fileReference?: unknown };
    const fileReference =
      (typeof eventPayload.fileReference === 'string' ? eventPayload.fileReference : undefined) ??
      (typeof domainEvent.attributes.fileReference === 'string' ? domainEvent.attributes.fileReference : undefined);

    if (typeof fileReference !== 'string' || fileReference.length === 0) {
      throw new InvalidArgumentException({
        message: 'SongInstrumentUpload upload event is missing a valid fileReference'
      });
    }

    return fileReference;
  }

  handlerException(ex: Exception): void {
    this.logger.error(ex, `[ValidateSongInstrumentUploadOnUploadRequested] Exception handler caught: ${ex.message}`);
  }
}
