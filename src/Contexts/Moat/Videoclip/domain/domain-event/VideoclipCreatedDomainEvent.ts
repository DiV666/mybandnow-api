import { DomainEvent } from '../../../../Shared/domain/DomainEvent.js';

export type VideoclipCreatedDomainEventAttributes = {
  readonly createdAt: string;
  readonly size: number;
  readonly duration: number;
  readonly url: string;
  readonly isPublic: boolean;
  readonly songId: string;
};

export class VideoclipCreatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'rubricae-moat-1-command-videoclip-created';

  readonly attributes: VideoclipCreatedDomainEventAttributes;

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
  } & VideoclipCreatedDomainEventAttributes) {
    super({ eventName: VideoclipCreatedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
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
    return new VideoclipCreatedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as VideoclipCreatedDomainEventAttributes)
    });
  }
}
