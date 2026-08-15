import { DomainEventSubscriber } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import type { CommandBus } from '@Contexts/Shared/domain/CommandBus.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { CompleteVideoclipCommand } from '@Contexts/Orchestrator/VideoclipProcess/application/complete/CompleteVideoclipCommand.js';

export type CommandBusResolver = () => CommandBus;

export class CompleteVideoclipOnVideoclipGenerationCompleted implements DomainEventSubscriber {
  module = 'CompleteVideoclipOnVideoclipGenerationCompleted';

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
    const finalVideoGcsPath = this.resolveFinalVideoGcsPath(domainEvent);
    const commandBus = this.commandBusResolver();

    this.logger.info(
      `[CompleteVideoclipOnVideoclipGenerationCompleted] Received videoclip generation completion for ${aggregateId}`
    );

    await commandBus.dispatch(new CompleteVideoclipCommand(aggregateId, finalVideoGcsPath));
  }

  private resolveFinalVideoGcsPath(domainEvent: DomainEvent): string {
    const finalVideoGcsPath = domainEvent.attributes.finalVideoGcsPath;

    if (typeof finalVideoGcsPath !== 'string' || finalVideoGcsPath.length === 0) {
      throw new InvalidArgumentException({
        message: 'Videoclip generation completed event is missing a valid finalVideoGcsPath'
      });
    }

    return finalVideoGcsPath;
  }

  handlerException(ex: Exception): void {
    this.logger.error(ex, `[CompleteVideoclipOnVideoclipGenerationCompleted] Exception handler caught: ${ex.message}`);
  }
}
