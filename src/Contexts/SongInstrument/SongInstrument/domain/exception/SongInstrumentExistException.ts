import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class SongInstrumentExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'SONGINSTRUMENT_ALREADY_EXISTS',
      message: `The SongInstrument id <${id}> already exists.`
    });
  }
}
