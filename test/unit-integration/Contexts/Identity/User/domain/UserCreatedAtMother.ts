import { UserCreatedAt } from '@Contexts/Identity/User/domain/value-object/UserCreatedAt.js';

export class UserCreatedAtMother {
  static create(value: Date): UserCreatedAt {
    return new UserCreatedAt(value);
  }

  static now(): UserCreatedAt {
    return this.create(new Date());
  }
}
