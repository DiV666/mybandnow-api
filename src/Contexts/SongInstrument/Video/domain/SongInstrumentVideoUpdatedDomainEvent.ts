import { DomainEvent, DomainEventAttributes } from '@Contexts/Shared/domain/DomainEvent.js';

export type SongInstrumentVideoUpdatedDomainEventAttributes = {
  readonly createdAt: string;
  readonly size: number;
  readonly duration: number;
  readonly url: string;
  readonly songInstrumentId: string;
  readonly startTimeMs: number;
};

export class SongInstrumentVideoUpdatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'song_instrument.1.video.updated';

  readonly attributes: SongInstrumentVideoUpdatedDomainEventAttributes;

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
  } & SongInstrumentVideoUpdatedDomainEventAttributes) {
    super({ eventName: SongInstrumentVideoUpdatedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
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
    return new SongInstrumentVideoUpdatedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as SongInstrumentVideoUpdatedDomainEventAttributes)
    });
  }
}
