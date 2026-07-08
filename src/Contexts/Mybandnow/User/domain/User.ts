import { AggregateRoot } from '@Contexts/Shared/domain/AggregateRoot.js';
import { UserRegisterDomainEvent } from './UserRegisterDomainEvent.js';
import { Primitives } from '@Contexts/Shared/domain/Primitives.js';
import { UserId } from './value-object/UserId.js';
import { UserCreatedAt } from './value-object/UserCreatedAt.js';
import { UserEmail } from './value-object/UserEmail.js';
import { UserPassword } from './value-object/UserPassword.js';

export class User extends AggregateRoot {
  constructor(
    readonly id: UserId,
    readonly password: UserPassword,
    readonly email: UserEmail,
    readonly createdAt: UserCreatedAt
  ) {
    super();
  }

  static create(id: UserId, email: UserEmail, password: UserPassword): User {
    const user = new User(id, password, email, new UserCreatedAt(new Date()));
    
    user.record(
      new UserRegisterDomainEvent({
        aggregateId: id.value,
        createdAt: user.createdAt.value.toISOString()
      })
    );

    return user;
  }
  static fromPrimitives(plainData: Primitives<User>): User {
    return new User(
      new UserId(plainData.id),
      new UserPassword(plainData.password),
      new UserEmail(plainData.email),
      new UserCreatedAt(plainData.createdAt)
    );
  }

  toPrimitives(): Primitives<User> {
    return {
      id: this.id.value,
      password: this.password.value,
      email: this.email.value,
      createdAt: this.createdAt.value
    };
  }
}
