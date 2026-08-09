import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class InvalidCredentialsException extends Exception {
  constructor() {
    super({
      message: 'The credentials provided are invalid',
      code: 'INVALID_CREDENTIALS'
    });
  }
}
