import { SongInstrument } from '../SongInstrument.js';
import { Nullable } from '../../../../Shared/domain/Nullable.js';
import { SongInstrumentId } from '../value-object/SongInstrumentId.js';

export interface SongInstrumentPersistenceRepository {
  search(id: SongInstrumentId): Promise<Nullable<SongInstrument>>;

  save(model: SongInstrument): Promise<void>;
}
