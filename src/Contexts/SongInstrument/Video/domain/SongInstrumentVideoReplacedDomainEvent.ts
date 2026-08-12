import { DomainEvent, DomainEventAttributes } from '@Contexts/Shared/domain/DomainEvent.js';

export type SongInstrumentVideoReplacedDomainEventAttributes = {
  readonly songInstrumentId: string;
  readonly oldUrl: string;
  readonly newUrl: string;
};

export class SongInstrumentVideoReplacedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'song_instrument.1.video.replaced';

  readonly attributes: SongInstrumentVideoReplacedDomainEventAttributes;

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
  } & SongInstrumentVideoReplacedDomainEventAttributes) {
    super({ eventName: SongInstrumentVideoReplacedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
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
    return new SongInstrumentVideoReplacedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as SongInstrumentVideoReplacedDomainEventAttributes)
    });
  }
}
