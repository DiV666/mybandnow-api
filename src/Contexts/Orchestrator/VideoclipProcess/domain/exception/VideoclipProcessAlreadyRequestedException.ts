import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class VideoclipProcessAlreadyRequestedException extends Exception {
  constructor(songId: string) {
    super({
      code: 'VIDEOCLIP_PROCESS_ALREADY_REQUESTED',
      message: `A videoclip generation process is already active for song <${songId}>.`
    });
  }
}
