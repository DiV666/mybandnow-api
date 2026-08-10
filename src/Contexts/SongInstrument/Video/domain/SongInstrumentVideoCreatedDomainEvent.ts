import { DomainEvent, DomainEventAttributes } from '@Contexts/Shared/domain/DomainEvent.js';

export type SongInstrumentVideoCreatedDomainEventAttributes = {
  readonly createdAt: string;
  readonly size: number;
  readonly duration: number;
  readonly url: string;
  readonly songInstrumentId: string;
  readonly startTimeMs: number;
};

export class SongInstrumentVideoCreatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'rubricae.moat.1.command.songinstrumentvideo.created';

  readonly attributes: SongInstrumentVideoCreatedDomainEventAttributes;

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
  } & SongInstrumentVideoCreatedDomainEventAttributes) {
    super({ eventName: SongInstrumentVideoCreatedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
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
    return new SongInstrumentVideoCreatedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as SongInstrumentVideoCreatedDomainEventAttributes)
    });
  }
}
