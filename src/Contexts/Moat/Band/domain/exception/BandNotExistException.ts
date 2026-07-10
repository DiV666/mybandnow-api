import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class BandNotExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'BAND_NOT_EXISTS',
      message: `The Band id <${id}> not exists.`
    });
  }
}
