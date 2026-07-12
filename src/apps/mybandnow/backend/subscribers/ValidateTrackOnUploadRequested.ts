import { DomainEventSubscriber } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import type { CommandBus } from '@Contexts/Shared/domain/CommandBus.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import { TrackProcessValidateCommand } from '@Contexts/Orchestrator/TrackProcess/application/TrackProcessValidateCommand.js';
import { TrackUploadRequestedDomainEvent } from '@Contexts/Moat/Track/domain/TrackUploadRequestedDomainEvent.js';

export type CommandBusResolver = () => CommandBus;

export class ValidateTrackOnUploadRequested implements DomainEventSubscriber {
  module = 'ValidateTrackOnUploadRequested';

  constructor(
    private readonly routingKey: string,
    private readonly logger: Logger,
    private readonly commandBusResolver: CommandBusResolver
  ) {}

  subscribedTo(): string[] {
    return [this.routingKey];
  }

  async on(domainEvent: TrackUploadRequestedDomainEvent): Promise<void> {
    const { aggregateId, fileReference } = domainEvent;
    const commandBus = this.commandBusResolver();

    this.logger.info(`[ValidateTrackOnUploadRequested] Received track upload event for ${aggregateId}`);
    await commandBus.dispatch(new TrackProcessValidateCommand(aggregateId, fileReference));
  }

  handlerException(ex: Exception): void {
    this.logger.error(ex, `[ValidateTrackOnUploadRequested] Exception handler caught: ${ex.message}`);
  }
}
