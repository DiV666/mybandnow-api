import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class BandExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'BAND_ALREADY_EXISTS',
      message: `The Band id <${id}> already exists.`
    });
  }
}
