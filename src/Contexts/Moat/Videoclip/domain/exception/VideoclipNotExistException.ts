import { Exception } from '../../../../Shared/domain/Exception.js';

export class VideoclipNotExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'VIDEOCLIP_NOT_EXISTS',
      message: `The Videoclip id <${id}> not exists.`
    });
  }
}
