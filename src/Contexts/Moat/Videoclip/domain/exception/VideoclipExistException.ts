import { Exception } from '../../../../Shared/domain/Exception.js';

export class VideoclipExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'VIDEOCLIP_ALREADY_EXISTS',
      message: `The Videoclip id <${id}> already exists.`
    });
  }
}
