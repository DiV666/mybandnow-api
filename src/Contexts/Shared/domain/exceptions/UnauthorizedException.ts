import { Exception } from '../Exception.js';

export class UnauthorizedException extends Exception {
  constructor(message = 'You do not have permissions to access this resource.') {
    super({
      code: 'UNAUTHORIZED',
      message
    });
  }
}
