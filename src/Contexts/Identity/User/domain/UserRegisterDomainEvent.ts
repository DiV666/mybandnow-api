import { DomainEvent, DomainEventAttributes } from '@Contexts/Shared/domain/DomainEvent.js';

export type UserRegisterDomainEventAttributes = {
  readonly email: string;
  readonly createdAt: string;
};

export class UserRegisterDomainEvent extends DomainEvent {
  static readonly EVENT_NAME: string = 'identity.1.user.register';

  readonly attributes: UserRegisterDomainEventAttributes;

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
  } & UserRegisterDomainEventAttributes) {
    super({ eventName: UserRegisterDomainEvent.EVENT_NAME, aggregateId, eventId, occurredOn, meta });
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
    return new UserRegisterDomainEvent({
      aggregateId,
      eventId,
      occurredOn,
      meta,
      ...(attributes as UserRegisterDomainEventAttributes)
    });
  }
}
