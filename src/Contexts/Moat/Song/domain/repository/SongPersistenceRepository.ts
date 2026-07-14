import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Song } from '../Song.js';
import { SongBandId } from '../value-object/SongBandId.js';
import { SongId } from '../value-object/SongId.js';

export interface SongPersistenceRepository {
  search(id: SongId): Promise<Nullable<Song>>;
  searchByBandId(bandId: SongBandId): Promise<Array<Song>>;
  countByBandId(bandId: SongBandId): Promise<number>;
  save(song: Song): Promise<void>;
}
