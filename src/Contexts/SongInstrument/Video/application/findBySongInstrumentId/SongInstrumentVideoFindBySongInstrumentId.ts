import { SongInstrumentVideoPersistenceRepository } from '../../domain/repository/SongInstrumentVideoPersistenceRepository.js';
import { SongInstrumentVideoSongInstrumentId } from '../../domain/value-object/SongInstrumentVideoSongInstrumentId.js';
import { FindSongInstrumentVideoBySongInstrumentIdResponse } from './FindSongInstrumentVideoBySongInstrumentIdResponse.js';

export class SongInstrumentVideoFindBySongInstrumentId {
  constructor(private readonly repository: SongInstrumentVideoPersistenceRepository) {}

  async run(songInstrumentId: string): Promise<FindSongInstrumentVideoBySongInstrumentIdResponse> {
    const video = await this.repository.searchBySongInstrumentId(
      new SongInstrumentVideoSongInstrumentId(songInstrumentId)
    );

    if (!video) {
      return new FindSongInstrumentVideoBySongInstrumentIdResponse(null);
    }

    const { id, url, songInstrumentId: resolvedSongInstrumentId, startTimeMs } = video.toPrimitives();

    return new FindSongInstrumentVideoBySongInstrumentIdResponse({
      id,
      url,
      songInstrumentId: resolvedSongInstrumentId,
      startTimeMs
    });
  }
}
