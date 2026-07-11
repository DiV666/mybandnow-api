import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class TrackNotExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'TRACK_NOT_EXISTS',
      message: `The Track id <${id}> not exists.`
    });
  }
}
