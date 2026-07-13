import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';

export type SongInstrumentUploadCompletedDomainEventAttributes = {
  readonly id: string;
  readonly songInstrumentId: string;
  readonly url: string;
  readonly duration: number;
  readonly size: number;
};

export class SongInstrumentUploadCompletedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'moat.song_instrument_upload.completed';

  readonly id: string;
  readonly songInstrumentId: string;
  readonly url: string;
  readonly duration: number;
  readonly size: number;

  constructor({
    aggregateId,
    id,
    songInstrumentId,
    url,
    duration,
    size,
    eventId,
    occurredOn
  }: {
    aggregateId: string;
    id: string;
    songInstrumentId: string;
    url: string;
    duration: number;
    size: number;
    eventId?: string;
    occurredOn?: Date;
  }) {
    super({ eventName: SongInstrumentUploadCompletedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn });
    this.id = id;
    this.songInstrumentId = songInstrumentId;
    this.url = url;
    this.duration = duration;
    this.size = size;
    this.attributes = {
      id: this.id,
      songInstrumentId: this.songInstrumentId,
      url: this.url,
      duration: this.duration,
      size: this.size
    };
  }

  toPrimitives(): SongInstrumentUploadCompletedDomainEventAttributes {
    return {
      id: this.id,
      songInstrumentId: this.songInstrumentId,
      url: this.url,
      duration: this.duration,
      size: this.size
    };
  }

  static fromPrimitives(params: {
    aggregateId: string;
    eventId: string;
    occurredOn: Date;
    attributes: Record<string, unknown>;
    meta?: Record<string, unknown>;
  }): DomainEvent {
    const attrs = params.attributes as unknown as SongInstrumentUploadCompletedDomainEventAttributes;
    return new SongInstrumentUploadCompletedDomainEvent({
      aggregateId: params.aggregateId,
      id: attrs.id,
      songInstrumentId: attrs.songInstrumentId,
      url: attrs.url,
      duration: attrs.duration,
      size: attrs.size,
      eventId: params.eventId,
      occurredOn: params.occurredOn
    });
  }
}
