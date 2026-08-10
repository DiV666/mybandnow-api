import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';

export type SongInstrumentUploadFailedDomainEventAttributes = {
  readonly id: string;
  readonly attemptId: string;
};

export class SongInstrumentUploadFailedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'moat.song_instrument_upload.failed';

  readonly id: string;
  readonly attemptId: string;

  constructor({
    aggregateId,
    id,
    attemptId,
    eventId,
    occurredOn
  }: {
    aggregateId: string;
    id: string;
    attemptId?: string;
    eventId?: string;
    occurredOn?: Date;
  }) {
    super({ eventName: SongInstrumentUploadFailedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn });
    this.id = id;
    this.attemptId = attemptId ?? aggregateId;
    this.attributes = {
      id: this.id,
      attemptId: this.attemptId
    };
  }

  toPrimitives(): SongInstrumentUploadFailedDomainEventAttributes {
    return {
      id: this.id,
      attemptId: this.attemptId
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
      attemptId: attrs.attemptId,
      eventId: params.eventId,
      occurredOn: params.occurredOn
    });
  }
}
