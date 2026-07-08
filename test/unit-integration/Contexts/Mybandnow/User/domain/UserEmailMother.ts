import { UserEmail } from '../../../../../../src/Contexts/Mybandnow/User/domain/value-object/UserEmail.js';
import { StringMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/StringMother.js';
export class UserEmailMother {
  static create(value: string): UserEmail {
    return new UserEmail(value);
  }

  static random(): UserEmail {
    return this.create(StringMother.random());
  }
}
