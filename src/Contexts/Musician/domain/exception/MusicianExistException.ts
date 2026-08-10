import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class MusicianExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'MUSICIAN_ALREADY_EXISTS',
      message: `The Musician id <${id}> already exists.`
    });
  }
}
