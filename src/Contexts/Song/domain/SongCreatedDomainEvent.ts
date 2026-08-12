import { DomainEvent, DomainEventAttributes } from '@Contexts/Shared/domain/DomainEvent.js';

export type SongCreatedDomainEventAttributes = {
  readonly bandId: string;
  readonly title: string;
  readonly originalVideoclipUrl: string;
};

export class SongCreatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'song.1.song.created';

  readonly attributes: SongCreatedDomainEventAttributes;

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
  } & SongCreatedDomainEventAttributes) {
    super({ eventName: SongCreatedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
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

    return new SongCreatedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as SongCreatedDomainEventAttributes)
    });
  }
}
