import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class InstrumentsExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'INSTRUMENTS_ALREADY_EXISTS',
      message: `The Instruments id <${id}> already exists.`
    });
  }
}
