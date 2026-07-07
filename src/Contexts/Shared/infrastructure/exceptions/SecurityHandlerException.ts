import { Exception } from '../../domain/Exception.js';

export class SecurityHandlerException extends Error {
  constructor(
    public readonly status: number,
    public readonly exception: Exception,
    options?: ErrorOptions
  ) {
    super(exception.message, options);
    this.name = 'SecurityHandlerException';
  }
}
