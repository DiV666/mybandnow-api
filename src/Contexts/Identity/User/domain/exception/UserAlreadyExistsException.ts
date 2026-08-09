import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class UserAlreadyExistsException extends Exception {
  constructor(email: string) {
    super({
      message: `User with email ${email} already exists`,
      code: 'user_already_exists'
    });
  }
}
