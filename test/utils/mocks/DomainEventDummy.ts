import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import { UuidMother } from '../../unit-integration/Contexts/Shared/domain/value-object/UuidMother.js';
import { DateMother } from '../../unit-integration/Contexts/Shared/domain/value-object/DateMother.js';

export class DomainEventDummy extends DomainEvent {
  static readonly EVENT_NAME = 'dummy:event';

  constructor(data: { aggregateId: string; eventId?: string; occurredOn?: Date; meta?: Record<string, unknown> }) {
    const { aggregateId, eventId, occurredOn, meta } = data;
    super({ eventName: DomainEventDummy.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
  }

  static fromPrimitives(params: {
    aggregateId: string;
    attributes: Record<string, unknown>;
    eventId: string;
    occurredOn: Date;
    meta?: Record<string, unknown>;
  }) {
    const { aggregateId, eventId, occurredOn, meta } = params;
    return new DomainEventDummy({
      aggregateId,
      eventId,
      occurredOn,
      meta
    });
  }
}

export class DomainEventDummyMother {
  static random() {
    return new DomainEventDummy({
      aggregateId: UuidMother.random(),
      eventId: UuidMother.random(),
      occurredOn: DateMother.random()
    });
  }
}
