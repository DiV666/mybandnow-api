import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';

export type VideoclipCompletedDomainEventAttributes = {
  readonly songId: string;
  readonly finalGcsPath: string;
};

export class VideoclipCompletedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'orchestrator.1.videoclip_process.completed';
  readonly attributes: VideoclipCompletedDomainEventAttributes;

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
  } & VideoclipCompletedDomainEventAttributes) {
    super({ eventName: VideoclipCompletedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
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
    return new VideoclipCompletedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as VideoclipCompletedDomainEventAttributes)
    });
  }
}
