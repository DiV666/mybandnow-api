import { SongInstrumentProcess } from '../SongInstrumentProcess.js';
import { SongInstrumentProcessId } from '../value-object/SongInstrumentProcessId.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';

export interface SongInstrumentProcessPersistenceRepository {
  save(songInstrumentProcess: SongInstrumentProcess): Promise<void>;
  search(id: SongInstrumentProcessId): Promise<Nullable<SongInstrumentProcess>>;
}
