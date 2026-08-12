import { DomainEvent, DomainEventAttributes } from '@Contexts/Shared/domain/DomainEvent.js';

export type BandUpdatedDomainEventAttributes = {
  readonly createdAt: string;
  readonly ownerId: string;
  readonly name: string;
};

export class BandUpdatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'band.1.band.updated';

  readonly attributes: BandUpdatedDomainEventAttributes;

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
  } & BandUpdatedDomainEventAttributes) {
    super({ eventName: BandUpdatedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
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
    return new BandUpdatedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as BandUpdatedDomainEventAttributes)
    });
  }
}
