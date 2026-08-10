import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class SongInstrumentNotExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'SONGINSTRUMENT_NOT_EXISTS',
      message: `The SongInstrument id <${id}> not exists.`
    });
  }
}
