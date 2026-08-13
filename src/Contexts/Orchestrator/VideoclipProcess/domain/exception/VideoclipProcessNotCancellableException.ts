import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class VideoclipProcessNotCancellableException extends Exception {
  constructor(id: string, status: string) {
    super({
      code: 'VIDEOCLIP_PROCESS_NOT_CANCELLABLE',
      message: `Videoclip generation process <${id}> cannot be cancelled because it is in status <${status}>.`,
      details: { id, status }
    });
  }
}
