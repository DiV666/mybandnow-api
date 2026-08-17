import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class SongInstrumentUploadNotCancellableException extends Exception {
  constructor(id: string, status: string) {
    super({
      code: 'SONG_INSTRUMENT_UPLOAD_NOT_CANCELLABLE',
      message: `SongInstrumentUpload <${id}> cannot be cancelled because it is in status <${status}>.`,
      details: { id, status }
    });
  }
}
