import { DomainEvent, DomainEventAttributes } from '@Contexts/Shared/domain/DomainEvent.js';

export type MusicianCreatedDomainEventAttributes = {
  readonly createdAt: string;
  readonly username: string;
  readonly name: string;
  readonly userId: string;
};

export class MusicianCreatedDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'rubricae.moat.1.command.musician.created';

  readonly attributes: MusicianCreatedDomainEventAttributes;

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
  } & MusicianCreatedDomainEventAttributes) {
    super({ eventName: MusicianCreatedDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
    this.attributes = attributes;
  }

  static fromPrimitives(params: {
    aggregateId: string;
    attributes: DomainEventAttributes;
    eventId: string;
    occurredOn: Date;
    meta?: Record<string, unknown>;
  }): DomainEvent {
    const { aggregateId, attributes, occurredOn, eventId, meta } = params;
    return new MusicianCreatedDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as MusicianCreatedDomainEventAttributes)
    });
  }
}
