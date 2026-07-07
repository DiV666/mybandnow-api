import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export class TestDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'kloding-mybandnow-1-command-test-passed';

  constructor(params: {
    eventName: string;
    aggregateId: string;
    attributes: Record<string, unknown>;
    eventId?: string;
    occurredOn?: Date;
  }) {
    super({ ...params });
    this.attributes = params.attributes;
  }

  static fromPrimitives(): DomainEvent {
    throw new InvalidArgumentException({ message: 'TestDomainEvent.fromPrimitives() is not implemented.' });
  }
}
