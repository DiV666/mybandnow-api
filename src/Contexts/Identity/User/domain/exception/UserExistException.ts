import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class UserExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'USER_ALREADY_EXISTS',
      message: `The User id <${id}> already exists.`
    });
  }
}
