import { UuidValueObject } from './value-object/UuidValueObject.js';

export abstract class DomainEvent {
  static readonly EVENT_NAME: string;
  static readonly fromPrimitives: (params: {
    aggregateId: string;
    eventId: string;
    occurredOn: Date;
    attributes: DomainEventAttributes;
    meta?: Record<string, unknown>;
  }) => DomainEvent;

  readonly aggregateId: string;
  readonly eventId: string;
  readonly occurredOn: Date;
  readonly eventName: string;
  attributes: DomainEventAttributes = {};
  meta: Record<string, unknown>;

  constructor(params: {
    eventName: string;
    aggregateId: string;
    eventId?: string;
    occurredOn?: Date;
    meta?: Record<string, unknown>;
  }) {
    const { aggregateId, eventName, eventId, occurredOn, meta } = params;
    this.aggregateId = aggregateId;
    this.eventId = eventId || UuidValueObject.random();
    this.occurredOn = occurredOn || new Date();
    this.meta = meta || {};
    this.eventName = eventName;
  }
}

export type DomainEventClass = {
  EVENT_NAME: string;
  attributes: DomainEventAttributes;
  fromPrimitives(params: {
    aggregateId: string;
    eventId: string;
    occurredOn: Date;
    attributes: DomainEventAttributes;
    meta?: Record<string, unknown>;
  }): DomainEvent;
};

export type DomainEventAttributes = Record<string, unknown>;
