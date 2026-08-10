import { SongInstrumentAuthorizationRepository } from '../../domain/repository/SongInstrumentAuthorizationRepository.js';
import { SongInstrumentMusicianId } from '../../domain/value-object/SongInstrumentMusicianId.js';
import { SongInstrumentSongId } from '../../domain/value-object/SongInstrumentSongId.js';
import { SongInstrumentCheckSongOwnershipQuery } from './SongInstrumentCheckSongOwnershipQuery.js';
import { SongInstrumentCheckSongOwnershipResponse } from './SongInstrumentCheckSongOwnershipResponse.js';

export class SongInstrumentCheckSongOwnership {
  constructor(private readonly repository: SongInstrumentAuthorizationRepository) {}

  async run(query: SongInstrumentCheckSongOwnershipQuery): Promise<SongInstrumentCheckSongOwnershipResponse> {
    const isOwner = await this.repository.isSongOwnedBy(
      new SongInstrumentSongId(query.songId),
      new SongInstrumentMusicianId(query.musicianId)
    );

    return new SongInstrumentCheckSongOwnershipResponse(isOwner);
  }
}
