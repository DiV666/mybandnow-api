import { SongBandId } from '../value-object/SongBandId.js';
import { SongMusicianId } from '../value-object/SongMusicianId.js';

export interface SongAuthorizationRepository {
  isBandMember(bandId: SongBandId, musicianId: SongMusicianId): Promise<boolean>;
}
