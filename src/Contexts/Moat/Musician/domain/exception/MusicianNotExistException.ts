import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class MusicianNotExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'MUSICIAN_NOT_EXISTS',
      message: `The Musician id <${id}> not exists.`
    });
  }
}
