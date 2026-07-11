import { TrackProcess } from '../TrackProcess.js';
import { TrackProcessId } from '../value-object/TrackProcessId.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';

export interface TrackProcessPersistenceRepository {
  save(trackProcess: TrackProcess): Promise<void>;
  search(id: TrackProcessId): Promise<Nullable<TrackProcess>>;
}
