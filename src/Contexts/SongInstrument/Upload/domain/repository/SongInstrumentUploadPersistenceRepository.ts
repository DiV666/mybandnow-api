import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { SongInstrumentUpload } from '../SongInstrumentUpload.js';
import { SongInstrumentUploadId } from '../value-object/SongInstrumentUploadId.js';
import { SongInstrumentUploadSongInstrumentId } from '../value-object/SongInstrumentUploadSongInstrumentId.js';
import { SongInstrument } from '@Contexts/SongInstrument/SongInstrument/domain/SongInstrument.js';

export interface SongInstrumentUploadPersistenceRepository {
  save(songInstrumentUpload: SongInstrumentUpload): Promise<void>;
  saveWithSongInstrument(songInstrumentUpload: SongInstrumentUpload, songInstrument: SongInstrument): Promise<void>;
  search(id: SongInstrumentUploadId): Promise<Nullable<SongInstrumentUpload>>;
  searchBySongInstrumentId(
    songInstrumentId: SongInstrumentUploadSongInstrumentId
  ): Promise<Nullable<SongInstrumentUpload>>;
  remove(id: SongInstrumentUploadId): Promise<void>;
}
