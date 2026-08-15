import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class VideoclipProcessNotFoundByIdException extends Exception {
  constructor(id: string) {
    super({
      code: 'VIDEOCLIP_PROCESS_NOT_FOUND',
      message: `No videoclip generation process found with id <${id}>.`,
      details: { id }
    });
  }
}
