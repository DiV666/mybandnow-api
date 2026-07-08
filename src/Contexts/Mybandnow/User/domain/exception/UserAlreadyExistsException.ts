import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class UserAlreadyExistsException extends Exception {
  constructor(email: string) {
    super({
      message: `The user with email <${email}> already exists`,
      name: 'UserAlreadyExistsException'
    });
  }
}
