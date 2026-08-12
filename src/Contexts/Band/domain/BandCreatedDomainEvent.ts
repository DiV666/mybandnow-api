import { DomainEvent, DomainEventAttributes } from '@Contexts/Shared/domain/DomainEvent.js';

export type BandCreatedDomainEventAttributes = {
  readonly createdAt: string;
  readonly ownerId: string;
  readonly name: string;
};

export class BandCreatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'band.1.band.created';

  readonly attributes: BandCreatedDomainEventAttributes;

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
  } & BandCreatedDomainEventAttributes) {
    super({ eventName: BandCreatedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
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
    return new BandCreatedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as BandCreatedDomainEventAttributes)
    });
  }
}
