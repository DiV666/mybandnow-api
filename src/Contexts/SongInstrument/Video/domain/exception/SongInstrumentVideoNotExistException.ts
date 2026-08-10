import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class SongInstrumentVideoNotExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'SONGINSTRUMENTVIDEO_NOT_EXISTS',
      message: `The SongInstrumentVideo id <${id}> not exists.`
    });
  }
}
