import { DomainEvent, DomainEventAttributes } from '@Contexts/Shared/domain/DomainEvent.js';

export type InstrumentsUpdatedDomainEventAttributes = {
  readonly createdAt: string;
  readonly description: string;
  readonly name: string;
};

export class InstrumentsUpdatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'instruments.1.instruments.updated';

  readonly attributes: InstrumentsUpdatedDomainEventAttributes;

  constructor({
    aggregateId,
    eventId,
    occurredOn,
    meta,
    ...attributes
  }: {
    aggregateId: string;
    eventId?: string;
    occurredOn?: Date;
    meta?: Record<string, unknown>;
  } & InstrumentsUpdatedDomainEventAttributes) {
    super({ eventName: InstrumentsUpdatedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
    this.attributes = attributes;
  }

  static fromPrimitives(params: {
    aggregateId: string;
    attributes: DomainEventAttributes;
    eventId: string;
    occurredOn: Date;
    meta?: Record<string, unknown>;
  }): DomainEvent {
    const { aggregateId, attributes, occurredOn, eventId, meta } = params;
    return new InstrumentsUpdatedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as InstrumentsUpdatedDomainEventAttributes)
    });
  }
}
