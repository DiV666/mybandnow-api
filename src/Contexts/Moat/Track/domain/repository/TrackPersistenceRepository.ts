import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Track } from '../Track.js';
import { TrackId } from '../value-object/TrackId.js';

export interface TrackPersistenceRepository {
  save(track: Track): Promise<void>;
  search(id: TrackId): Promise<Nullable<Track>>;
  remove(id: TrackId): Promise<void>;
}
