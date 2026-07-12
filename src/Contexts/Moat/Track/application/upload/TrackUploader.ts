import { Clock } from '@Contexts/Shared/domain/Clock.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { TrackPersistenceRepository } from '../../domain/repository/TrackPersistenceRepository.js';
import { SongInstrumentPersistenceRepository } from '@Contexts/Moat/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentId } from '@Contexts/Moat/SongInstrument/domain/value-object/SongInstrumentId.js';
import { SongInstrumentNotExistException } from '@Contexts/Moat/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { FileReference } from '@Contexts/Shared/domain/value-object/FileReference.js';
import { Track } from '../../domain/Track.js';
import { TrackId } from '../../domain/value-object/TrackId.js';
import { TrackSongId } from '../../domain/value-object/TrackSongId.js';
import { TrackSongInstrumentId } from '../../domain/value-object/TrackSongInstrumentId.js';

export class TrackUploader {
  constructor(
    private readonly repository: TrackPersistenceRepository,
    private readonly songInstrumentRepository: SongInstrumentPersistenceRepository,
    private readonly eventBus: EventBus,
    private readonly clock: Clock
  ) {}

  async run(command: {
    songId: string;
    instrumentId: string;
    musicianId: string;
    fileReference: string;
  }): Promise<void> {
    const songInstrumentId = new SongInstrumentId(command.instrumentId);
    const songInstrument = await this.songInstrumentRepository.search(songInstrumentId);

    if (!songInstrument || songInstrument.songId.value !== command.songId) {
      throw new SongInstrumentNotExistException(songInstrumentId.value);
    }

    if (songInstrument.musicianId.value !== command.musicianId) {
      throw new ForbiddenException('Only the assigned musician can upload for this song instrument.');
    }

    const fileReference = new FileReference(command.fileReference);
    const trackSongInstrumentId = new TrackSongInstrumentId(songInstrument.id.value);
    const trackSongId = new TrackSongId(songInstrument.songId.value);
    const track =
      (await this.repository.searchBySongInstrumentId(trackSongInstrumentId)) ??
      Track.create(
        {
          id: TrackId.random(),
          instrumentName: songInstrument.name.value,
          songInstrumentId: trackSongInstrumentId.value,
          songId: trackSongId.value
        },
        this.clock
      );

    track.processUpload(fileReference);

    await this.repository.save(track);
    await this.eventBus.publish(track.pullDomainEvents());
  }
}
