import { DomainEvent, DomainEventAttributes } from '@Contexts/Shared/domain/DomainEvent.js';

export type SongInstrumentCreatedDomainEventAttributes = {
  readonly createdAt: string;
  readonly musicianId: string;
  readonly instrumentId: string;
  readonly songId: string;
  readonly name: string;
};

export class SongInstrumentCreatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'rubricae.moat.1.command.songinstrument.created';

  readonly attributes: SongInstrumentCreatedDomainEventAttributes;

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
  } & SongInstrumentCreatedDomainEventAttributes) {
    super({ eventName: SongInstrumentCreatedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
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
    return new SongInstrumentCreatedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as SongInstrumentCreatedDomainEventAttributes)
    });
  }
}
