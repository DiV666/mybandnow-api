import { DomainEventSubscriber } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import type { CommandBus } from '@Contexts/Shared/domain/CommandBus.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { FailVideoclipCommand } from '@Contexts/Orchestrator/VideoclipProcess/application/fail/FailVideoclipCommand.js';

export type CommandBusResolver = () => CommandBus;

type VideoclipGenerationFailedPayload = {
  errorCode: string;
  errorMessage: string;
  failedPhase: string;
};

export class FailVideoclipOnVideoclipGenerationFailed implements DomainEventSubscriber {
  module = 'FailVideoclipOnVideoclipGenerationFailed';

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
    const payload = this.resolvePayload(domainEvent);
    const commandBus = this.commandBusResolver();

    this.logger.info(
      `[FailVideoclipOnVideoclipGenerationFailed] Received videoclip generation failure for ${aggregateId}`
    );

    await commandBus.dispatch(
      new FailVideoclipCommand(aggregateId, payload.errorCode, payload.errorMessage, payload.failedPhase)
    );
  }

  private resolvePayload(domainEvent: DomainEvent): VideoclipGenerationFailedPayload {
    const errorCode = domainEvent.attributes.errorCode;
    const errorMessage = domainEvent.attributes.errorMessage;
    const failedPhase = domainEvent.attributes.failedPhase;

    if (
      typeof errorCode !== 'string' ||
      errorCode.length === 0 ||
      typeof errorMessage !== 'string' ||
      errorMessage.length === 0 ||
      typeof failedPhase !== 'string' ||
      failedPhase.length === 0
    ) {
      throw new InvalidArgumentException({
        message: 'Videoclip generation failed event is missing a valid errorCode, errorMessage, or failedPhase'
      });
    }

    return { errorCode, errorMessage, failedPhase };
  }

  handlerException(ex: Exception): void {
    this.logger.error(ex, `[FailVideoclipOnVideoclipGenerationFailed] Exception handler caught: ${ex.message}`);
  }
}
