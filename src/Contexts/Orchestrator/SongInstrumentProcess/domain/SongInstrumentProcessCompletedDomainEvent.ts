import { DomainEvent } from '../../../Shared/domain/DomainEvent.js';

export type SongInstrumentProcessCompletedDomainEventAttributes = {
  readonly attemptId: string;
  readonly url: string;
  readonly duration: number;
  readonly size: number;
};

export class SongInstrumentProcessCompletedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'orchestrator.song_instrument_process.completed';

  readonly attemptId: string;
  readonly url: string;
  readonly duration: number;
  readonly size: number;

  constructor(params: {
    aggregateId: string;
    attemptId?: string;
    url: string;
    duration: number;
    size: number;
    eventId?: string;
    occurredOn?: Date;
    meta?: Record<string, unknown>;
  }) {
    super({
      eventName: SongInstrumentProcessCompletedDomainEvent.EVENT_NAME,
      aggregateId: params.aggregateId,
      eventId: params.eventId,
      occurredOn: params.occurredOn,
      meta: params.meta
    });
    this.attemptId = params.attemptId ?? params.aggregateId;
    this.url = params.url;
    this.duration = params.duration;
    this.size = params.size;
    this.attributes = {
      attemptId: this.attemptId,
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
    const attrs = params.attributes as SongInstrumentProcessCompletedDomainEventAttributes;
    return new SongInstrumentProcessCompletedDomainEvent({
      aggregateId: params.aggregateId,
      attemptId: attrs.attemptId,
      url: attrs.url,
      duration: attrs.duration,
      size: attrs.size,
      eventId: params.eventId,
      occurredOn: params.occurredOn,
      meta: params.meta
    });
  }
}
