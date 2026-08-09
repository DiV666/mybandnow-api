import { User } from '@Contexts/Identity/User/domain/User.js';
import {
  UserRegisterDomainEvent,
  UserRegisterDomainEventAttributes
} from '@Contexts/Identity/User/domain/UserRegisterDomainEvent.js';

export class UserRegisterDomainEventMother {
  static create(
    params: {
      aggregateId: string;
      eventId?: string;
      occurredOn?: Date;
    } & UserRegisterDomainEventAttributes
  ): UserRegisterDomainEvent {
    return new UserRegisterDomainEvent(params);
  }

  static fromModel(model: User): UserRegisterDomainEvent {
    const { id, createdAt: createdAtRaw, ...primitives } = model.toPrimitives();
    return this.create({
      aggregateId: id,
      createdAt: createdAtRaw instanceof Date ? createdAtRaw.toISOString() : createdAtRaw,
      ...primitives
    });
  }
}
