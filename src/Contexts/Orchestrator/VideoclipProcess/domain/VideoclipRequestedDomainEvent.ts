import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';

export type VideoclipRequestedInstrumentAttributes = {
  readonly songInstrumentId: string;
  readonly videoUrl: string;
  readonly instrumentName: string;
};

export type VideoclipRequestedDomainEventAttributes = {
  readonly songId: string;
  readonly originalVideoclipUrl: string;
  readonly instruments: Array<VideoclipRequestedInstrumentAttributes>;
};

export class VideoclipRequestedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'orchestrator.1.videoclip_process.requested';
  readonly attributes: VideoclipRequestedDomainEventAttributes;

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
  } & VideoclipRequestedDomainEventAttributes) {
    super({ eventName: VideoclipRequestedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
    this.attributes = attributes;
  }

  static fromPrimitives(params: {
    aggregateId: string;
    eventId: string;
    occurredOn: Date;
    attributes: Record<string, unknown>;
    meta?: Record<string, unknown>;
  }): DomainEvent {
    const { aggregateId, attributes, occurredOn, eventId, meta } = params;
    return new VideoclipRequestedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as VideoclipRequestedDomainEventAttributes)
    });
  }
}
