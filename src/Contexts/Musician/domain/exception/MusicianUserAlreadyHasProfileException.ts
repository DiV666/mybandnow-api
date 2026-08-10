import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class MusicianUserAlreadyHasProfileException extends Exception {
  constructor(userId: string) {
    super({
      code: 'MUSICIAN_USER_ALREADY_HAS_PROFILE',
      message: `The user <${userId}> already has a musician profile.`
    });
  }
}
