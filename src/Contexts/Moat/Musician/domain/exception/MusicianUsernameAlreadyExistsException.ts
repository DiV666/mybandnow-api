import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class MusicianUsernameAlreadyExistsException extends Exception {
  constructor(username: string) {
    super({
      code: 'MUSICIAN_USERNAME_ALREADY_EXISTS',
      message: `The username <${username}> is already in use.`
    });
  }
}
