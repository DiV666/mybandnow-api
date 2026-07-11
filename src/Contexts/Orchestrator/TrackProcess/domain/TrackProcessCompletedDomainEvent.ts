import { DomainEvent } from '../../../Shared/domain/DomainEvent.js';

export class TrackProcessCompletedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'orchestrator.track_process.completed';

  constructor(params: { aggregateId: string; eventId?: string; occurredOn?: Date; meta?: Record<string, unknown> }) {
    super({
      eventName: TrackProcessCompletedDomainEvent.EVENT_NAME,
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
    return new TrackProcessCompletedDomainEvent({
      aggregateId: params.aggregateId,
      eventId: params.eventId,
      occurredOn: params.occurredOn,
      meta: params.meta
    });
  }
}
