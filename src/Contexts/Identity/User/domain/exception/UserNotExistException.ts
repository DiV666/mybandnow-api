import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class UserNotExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'USER_NOT_EXISTS',
      message: `The User id <${id}> not exists.`
    });
  }
}
