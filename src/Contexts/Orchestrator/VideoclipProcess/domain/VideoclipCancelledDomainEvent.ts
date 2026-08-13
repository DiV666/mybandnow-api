import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';

export type VideoclipCancelledDomainEventAttributes = {
  readonly songId: string;
};

export class VideoclipCancelledDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'orchestrator.1.videoclip_process.cancelled';
  readonly attributes: VideoclipCancelledDomainEventAttributes;

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
  } & VideoclipCancelledDomainEventAttributes) {
    super({ eventName: VideoclipCancelledDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
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
    return new VideoclipCancelledDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as VideoclipCancelledDomainEventAttributes)
    });
  }
}
