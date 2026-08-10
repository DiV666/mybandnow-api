import { SongInstrumentMusicianId } from '../value-object/SongInstrumentMusicianId.js';
import { SongInstrumentSongId } from '../value-object/SongInstrumentSongId.js';

export interface SongInstrumentAuthorizationRepository {
  isSongOwnedBy(songId: SongInstrumentSongId, musicianId: SongInstrumentMusicianId): Promise<boolean>;

  isBandMember(songId: SongInstrumentSongId, musicianId: SongInstrumentMusicianId): Promise<boolean>;
}
