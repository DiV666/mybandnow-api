import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';

export class SongInstrumentProcessFailedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME = 'orchestrator.1.song_instrument_process.failed';

  readonly attemptId: string;
  readonly publicErrorMessage: string;
  readonly publicErrorCode: string;

  constructor(params: {
    aggregateId: string;
    attemptId?: string;
    publicErrorMessage: string;
    publicErrorCode: string;
    eventId?: string;
    occurredOn?: Date;
    meta?: Record<string, unknown>;
  }) {
    super({
      eventName: SongInstrumentProcessFailedDomainEvent.EVENT_NAME,
      aggregateId: params.aggregateId,
      eventId: params.eventId,
      occurredOn: params.occurredOn,
      meta: params.meta
    });
    this.attemptId = params.attemptId ?? params.aggregateId;
    this.publicErrorMessage = params.publicErrorMessage;
    this.publicErrorCode = params.publicErrorCode;
    this.attributes = {
      attemptId: this.attemptId,
      publicErrorMessage: this.publicErrorMessage,
      publicErrorCode: this.publicErrorCode
    };
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
      attemptId:
        typeof params.attributes.attemptId === 'string' && params.attributes.attemptId.length > 0
          ? params.attributes.attemptId
          : params.aggregateId,
      publicErrorMessage:
        typeof params.attributes.publicErrorMessage === 'string' && params.attributes.publicErrorMessage.length > 0
          ? params.attributes.publicErrorMessage
          : 'The uploaded video could not be processed. Please try again.',
      publicErrorCode:
        typeof params.attributes.publicErrorCode === 'string' && params.attributes.publicErrorCode.length > 0
          ? params.attributes.publicErrorCode
          : 'PROCESSING_FAILED',
      eventId: params.eventId,
      occurredOn: params.occurredOn,
      meta: params.meta
    });
  }
}
