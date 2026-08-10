import { SongInstrumentVideo } from '../SongInstrumentVideo.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { SongInstrumentVideoId } from '../value-object/SongInstrumentVideoId.js';
import { SongInstrumentVideoSongInstrumentId } from '../value-object/SongInstrumentVideoSongInstrumentId.js';

export interface SongInstrumentVideoPersistenceRepository {
  search(id: SongInstrumentVideoId): Promise<Nullable<SongInstrumentVideo>>;

  searchBySongInstrumentId(
    songInstrumentId: SongInstrumentVideoSongInstrumentId
  ): Promise<Nullable<SongInstrumentVideo>>;

  save(model: SongInstrumentVideo): Promise<void>;
}
