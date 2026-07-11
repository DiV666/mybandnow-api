import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';

type TrackFailedDomainEventAttributes = {
  readonly id: string;
};

export class TrackFailedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'moat.track.failed';

  readonly id: string;

  constructor({
    aggregateId,
    id,
    eventId,
    occurredOn
  }: {
    aggregateId: string;
    id: string;
    eventId?: string;
    occurredOn?: Date;
  }) {
    super({ eventName: TrackFailedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn });
    this.id = id;
  }

  toPrimitives(): TrackFailedDomainEventAttributes {
    return {
      id: this.id
    };
  }

  static fromPrimitives(params: {
    aggregateId: string;
    eventId: string;
    occurredOn: Date;
    attributes: Record<string, unknown>;
    meta?: Record<string, unknown>;
  }): DomainEvent {
    const attrs = params.attributes as unknown as TrackFailedDomainEventAttributes;
    return new TrackFailedDomainEvent({
      aggregateId: params.aggregateId,
      id: attrs.id,
      eventId: params.eventId,
      occurredOn: params.occurredOn
    });
  }
}
