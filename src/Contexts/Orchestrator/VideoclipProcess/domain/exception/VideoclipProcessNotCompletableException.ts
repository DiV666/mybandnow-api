import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class VideoclipProcessNotCompletableException extends Exception {
  constructor(id: string, status: string) {
    super({
      code: 'VIDEOCLIP_PROCESS_NOT_COMPLETABLE',
      message: `Videoclip generation process <${id}> cannot be completed because it is in status <${status}>.`,
      details: { id, status }
    });
  }
}
