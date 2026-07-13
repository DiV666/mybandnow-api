import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class SongInstrumentUploadNotExistException extends Exception {
  constructor(id: string) {
    super({
      code: 'TRACK_NOT_EXISTS',
      message: `The SongInstrumentUpload id <${id}> not exists.`
    });
  }
}
