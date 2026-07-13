import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class SongInstrumentUploadExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'TRACK_ALREADY_EXISTS',
      message: `The SongInstrumentUpload id <${id}> already exists.`
    });
  }
}
