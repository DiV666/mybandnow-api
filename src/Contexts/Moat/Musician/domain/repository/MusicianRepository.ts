import { Musician } from '../Musician.js';
import { MusicianId } from '../value-object/MusicianId.js';
import { MusicianUserId } from '../value-object/MusicianUserId.js';
import { MusicianUsername } from '../value-object/MusicianUsername.js';
import { Nullable } from '@Contexts/Shared/domain/Nullable.js';

export interface MusicianRepository {
  save(musician: Musician): Promise<void>;
  search(id: MusicianId): Promise<Nullable<Musician>>;
  searchByUserId(userId: MusicianUserId): Promise<Nullable<Musician>>;
  searchByUsername(username: MusicianUsername): Promise<Nullable<Musician>>;
}
