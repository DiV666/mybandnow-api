import { User } from '@Contexts/Mybandnow/User/domain/User.js';
import {
  UserRegisterDomainEvent,
  UserRegisterDomainEventAttributes
} from '@Contexts/Mybandnow/User/domain/UserRegisterDomainEvent.js';

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
