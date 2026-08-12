import { Exception } from '@Contexts/Shared/domain/Exception.js';

export class IncompleteSongInstrumentsException extends Exception {
  constructor(songId: string, missingSongInstrumentIds: Array<string>) {
    super({
      code: 'INCOMPLETE_SONG_INSTRUMENTS',
      message: `Song <${songId}> is not ready for videoclip generation: missing uploaded video for song instrument(s) <${missingSongInstrumentIds.join(', ')}>.`,
      details: { songId, missingSongInstrumentIds }
    });
  }
}
