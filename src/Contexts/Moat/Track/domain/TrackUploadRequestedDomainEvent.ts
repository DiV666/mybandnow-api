import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';

type TrackUploadRequestedDomainEventAttributes = {
  fileReference: string;
};

export class TrackUploadRequestedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'moat.track.upload_requested';
  readonly fileReference: string;

  constructor(params: {
    aggregateId: string;
    fileReference: string;
    eventId?: string;
    occurredOn?: Date;
    meta?: Record<string, unknown>;
  }) {
    super({
      eventName: TrackUploadRequestedDomainEvent.EVENT_NAME,
      aggregateId: params.aggregateId,
      eventId: params.eventId,
      occurredOn: params.occurredOn,
      meta: params.meta
    });
    this.fileReference = params.fileReference;
    this.attributes = {
      fileReference: this.fileReference
    };
  }

  static fromPrimitives(params: {
    aggregateId: string;
    eventId: string;
    occurredOn: Date;
    attributes: Record<string, unknown>;
    meta?: Record<string, unknown>;
  }): DomainEvent {
    const attrs = params.attributes as unknown as TrackUploadRequestedDomainEventAttributes;
    return new TrackUploadRequestedDomainEvent({
      aggregateId: params.aggregateId,
      fileReference: attrs.fileReference,
      eventId: params.eventId,
      occurredOn: params.occurredOn,
      meta: params.meta
    });
  }
}
