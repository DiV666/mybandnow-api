import { Exception } from '../Exception.js';

export class ForbiddenException extends Exception {
  constructor(message = 'You do not have permissions to access this resource.') {
    super({
      code: 'FORBIDDEN',
      message
    });
  }
}
