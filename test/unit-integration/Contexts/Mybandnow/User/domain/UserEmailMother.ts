import { UserEmail } from '@Contexts/Mybandnow/User/domain/value-object/UserEmail.js';
import { EmailMother } from '@Test/unit-integration/Contexts/Shared/domain/value-object/EmailMother.js';
export class UserEmailMother {
  static create(value: string): UserEmail {
    return new UserEmail(value);
  }

  static random(): UserEmail {
    return this.create(EmailMother.random());
  }
}
