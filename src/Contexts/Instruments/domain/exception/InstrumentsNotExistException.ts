import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class InstrumentsNotExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'INSTRUMENTS_NOT_EXISTS',
      message: `The Instruments id <${id}> not exists.`
    });
  }
}
