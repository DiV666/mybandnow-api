import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class VideoclipProcessNotFoundException extends Exception {
  constructor(songId: string) {
    super({
      code: 'VIDEOCLIP_PROCESS_NOT_FOUND',
      message: `No active videoclip generation process found for song <${songId}>.`,
      details: { songId }
    });
  }
}
