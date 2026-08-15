import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';

export type VideoclipFailedDomainEventAttributes = {
  readonly songId: string;
  readonly errorCode: string;
  readonly errorMessage: string;
  readonly failedPhase: string;
};

export class VideoclipFailedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'orchestrator.1.videoclip_process.failed';
  readonly attributes: VideoclipFailedDomainEventAttributes;

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
  } & VideoclipFailedDomainEventAttributes) {
    super({ eventName: VideoclipFailedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
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
    return new VideoclipFailedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as VideoclipFailedDomainEventAttributes)
    });
  }
}
