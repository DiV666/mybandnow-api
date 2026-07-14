import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class SongExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'SONG_ALREADY_EXISTS',
      message: `The Song id <${id}> already exists.`
    });
  }
}
