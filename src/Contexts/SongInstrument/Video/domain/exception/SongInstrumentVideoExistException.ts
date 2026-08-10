import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class SongInstrumentVideoExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'SONGINSTRUMENTVIDEO_ALREADY_EXISTS',
      message: `The SongInstrumentVideo id <${id}> already exists.`
    });
  }
}
