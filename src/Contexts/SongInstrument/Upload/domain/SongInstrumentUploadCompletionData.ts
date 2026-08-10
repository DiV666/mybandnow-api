import { SongInstrumentUploadDuration } from './value-object/SongInstrumentUploadDuration.js';
import { SongInstrumentUploadSize } from './value-object/SongInstrumentUploadSize.js';
import { SongInstrumentUploadUrl } from './value-object/SongInstrumentUploadUrl.js';

export interface SongInstrumentUploadCompletionData {
  url: SongInstrumentUploadUrl;
  duration: SongInstrumentUploadDuration;
  size: SongInstrumentUploadSize;
}
