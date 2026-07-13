import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';

export type SongInstrumentUploadFailedDomainEventAttributes = {
  readonly id: string;
};

export class SongInstrumentUploadFailedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'moat.song_instrument_upload.failed';

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
    super({ eventName: SongInstrumentUploadFailedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn });
    this.id = id;
  }

  toPrimitives(): SongInstrumentUploadFailedDomainEventAttributes {
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
    const attrs = params.attributes as unknown as SongInstrumentUploadFailedDomainEventAttributes;
    return new SongInstrumentUploadFailedDomainEvent({
      aggregateId: params.aggregateId,
      id: attrs.id,
      eventId: params.eventId,
      occurredOn: params.occurredOn
    });
  }
}
