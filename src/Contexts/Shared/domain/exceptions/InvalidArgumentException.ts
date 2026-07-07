import { Exception } from '../Exception.js';

export class InvalidArgumentException extends Exception {
  constructor({ code, message, details }: { code?: string; message: string; details?: unknown }) {
    super({
      code,
      message,
      details
    });
  }
}
