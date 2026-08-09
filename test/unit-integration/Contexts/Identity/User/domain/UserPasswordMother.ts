import { UserPassword } from '../../../../../../src/Contexts/Mybandnow/User/domain/value-object/UserPassword.js';
import { StringMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/StringMother.js';
export class UserPasswordMother {
  static create(value: string): UserPassword {
    return new UserPassword(value);
  }

  static random(): UserPassword {
    return this.create(StringMother.random());
  }
}
