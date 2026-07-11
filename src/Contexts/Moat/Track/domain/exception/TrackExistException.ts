import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class TrackExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'TRACK_ALREADY_EXISTS',
      message: `The Track id <${id}> already exists.`
    });
  }
}
