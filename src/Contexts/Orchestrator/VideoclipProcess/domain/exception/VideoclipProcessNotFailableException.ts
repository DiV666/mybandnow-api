import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class VideoclipProcessNotFailableException extends Exception {
  constructor(id: string, status: string) {
    super({
      code: 'VIDEOCLIP_PROCESS_NOT_FAILABLE',
      message: `Videoclip generation process <${id}> cannot be marked as failed because it is in status <${status}>.`,
      details: { id, status }
    });
  }
}
