import { Exception } from '../Exception.js';

export class InvalidArgumentException extends Exception {
  constructor({
    code,
    message,
    details,
    publicMessage
  }: {
    code?: string;
    message: string;
    details?: unknown;
    publicMessage?: string;
  }) {
    super({
      code,
      message,
      details,
      publicMessage
    });
  }
}
