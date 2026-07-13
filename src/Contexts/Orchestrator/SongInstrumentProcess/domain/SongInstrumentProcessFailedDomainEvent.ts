import { DomainEvent } from '../../../Shared/domain/DomainEvent.js';

export class SongInstrumentProcessFailedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'orchestrator.song_instrument_process.failed';

  constructor(params: { aggregateId: string; eventId?: string; occurredOn?: Date; meta?: Record<string, unknown> }) {
    super({
      eventName: SongInstrumentProcessFailedDomainEvent.EVENT_NAME,
      aggregateId: params.aggregateId,
      eventId: params.eventId,
      occurredOn: params.occurredOn,
      meta: params.meta
    });
  }

  static fromPrimitives(params: {
    aggregateId: string;
    eventId: string;
    occurredOn: Date;
    attributes: Record<string, unknown>;
    meta?: Record<string, unknown>;
  }): DomainEvent {
    return new SongInstrumentProcessFailedDomainEvent({
      aggregateId: params.aggregateId,
      eventId: params.eventId,
      occurredOn: params.occurredOn,
      meta: params.meta
    });
  }
}
