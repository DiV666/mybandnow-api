import { DomainEvent, DomainEventAttributes } from '@Contexts/Shared/domain/DomainEvent.js';

export type BandRemovedDomainEventAttributes = {
  readonly createdAt: string;
  readonly ownerId: string;
  readonly name: string;
};

export class BandRemovedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'band.1.band.removed';

  readonly attributes: BandRemovedDomainEventAttributes;

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
  } & BandRemovedDomainEventAttributes) {
    super({ eventName: BandRemovedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
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
    return new BandRemovedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as BandRemovedDomainEventAttributes)
    });
  }
}
