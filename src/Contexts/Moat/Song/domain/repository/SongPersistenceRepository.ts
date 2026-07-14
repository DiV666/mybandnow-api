import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Song } from '../Song.js';
import { SongBandId } from '../value-object/SongBandId.js';
import { SongId } from '../value-object/SongId.js';
import { SongMusicianId } from '../value-object/SongMusicianId.js';

export interface SongPersistenceRepository {
  search(id: SongId): Promise<Nullable<Song>>;
  searchByBandId(bandId: SongBandId): Promise<Array<Song>>;
  countByBandId(bandId: SongBandId): Promise<number>;
  matching(criteria: Criteria, musicianId: SongMusicianId): Promise<Array<Song>>;
  matchingCount(criteria: Criteria, musicianId: SongMusicianId): Promise<number>;
  save(song: Song): Promise<void>;
}
