import { SongInstrumentVideo } from '../SongInstrumentVideo.js';
import { Nullable } from '../../../../Shared/domain/Nullable.js';
import { SongInstrumentVideoId } from '../value-object/SongInstrumentVideoId.js';

export interface SongInstrumentVideoPersistenceRepository {
  search(id: SongInstrumentVideoId): Promise<Nullable<SongInstrumentVideo>>;

  save(model: SongInstrumentVideo): Promise<void>;
}
