import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class SongNotExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'SONG_NOT_EXISTS',
      message: `The Song id <${id}> does not exist.`
    });
  }
}
