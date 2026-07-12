import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';

export type TrackCompletedDomainEventAttributes = {
  readonly id: string;
};

export class TrackCompletedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'moat.track.completed';

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
    super({ eventName: TrackCompletedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn });
    this.id = id;
  }

  toPrimitives(): TrackCompletedDomainEventAttributes {
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
    const attrs = params.attributes as unknown as TrackCompletedDomainEventAttributes;
    return new TrackCompletedDomainEvent({
      aggregateId: params.aggregateId,
      id: attrs.id,
      eventId: params.eventId,
      occurredOn: params.occurredOn
    });
  }
}
