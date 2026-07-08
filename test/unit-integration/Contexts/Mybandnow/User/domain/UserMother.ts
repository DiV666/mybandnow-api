import { User } from '@Contexts/Mybandnow/User/domain/User.js';
import { UserIdMother } from './UserIdMother.js';
import { Repeater } from '@Test/unit-integration/Contexts/Shared/domain/value-object/Repeater.js';
import { UserCreatedAtMother } from './UserCreatedAtMother.js';
import { UserEmailMother } from './UserEmailMother.js';
import { UserPasswordMother } from './UserPasswordMother.js';

export class UserMother {
  private static defaults(): Partial<User> {
    return {
      id: UserIdMother.random(),
      password: UserPasswordMother.random(),
      email: UserEmailMother.random(),
      createdAt: UserCreatedAtMother.now()
    };
  }

  static create(...params: Partial<User>[]): User {
    const data = Object.assign({}, UserMother.defaults(), ...params) as Required<User>;

    return User.fromPrimitives({
      id: data.id.value,
      password: data.password.value,
      email: data.email.value,
      createdAt: data.createdAt.value
    });
  }

  static random(): User {
    return UserMother.create(UserMother.defaults());
  }

  static createList(): Array<User> {
    return Repeater.random(UserMother.create);
  }
}
