import { ForbiddenException } from '@Contexts/Shared/domain/exceptions/ForbiddenException.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { SongInstrumentNotExistException } from '@Contexts/SongInstrument/SongInstrument/domain/exception/SongInstrumentNotExistException.js';
import { SongInstrumentAuthorizationRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentAuthorizationRepository.js';
import { SongInstrumentPersistenceRepository } from '@Contexts/SongInstrument/SongInstrument/domain/repository/SongInstrumentPersistenceRepository.js';
import { SongInstrumentId } from '@Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentId.js';
import { SongInstrumentMusicianId } from '@Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentMusicianId.js';
import { SongInstrumentSongId } from '@Contexts/SongInstrument/SongInstrument/domain/value-object/SongInstrumentSongId.js';
import { SongInstrumentVideoNotExistException } from '../../domain/exception/SongInstrumentVideoNotExistException.js';
import { SongInstrumentVideoPersistenceRepository } from '../../domain/repository/SongInstrumentVideoPersistenceRepository.js';
import { SongInstrumentVideoSongInstrumentId } from '../../domain/value-object/SongInstrumentVideoSongInstrumentId.js';
import { SongInstrumentVideoUpdateStartTimeCommand } from './SongInstrumentVideoUpdateStartTimeCommand.js';

export class SongInstrumentVideoUpdateStartTime {
  constructor(
    private readonly songInstrumentRepository: SongInstrumentPersistenceRepository,
    private readonly authorizationRepository: SongInstrumentAuthorizationRepository,
    private readonly songInstrumentVideoRepository: SongInstrumentVideoPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(command: SongInstrumentVideoUpdateStartTimeCommand): Promise<void> {
    const isBandMember = await this.authorizationRepository.isBandMember(
      new SongInstrumentSongId(command.songId),
      new SongInstrumentMusicianId(command.musicianId)
    );

    if (!isBandMember) {
      throw new ForbiddenException('Only band members can update song instrument videos.');
    }

    const songInstrument = await this.songInstrumentRepository.search(new SongInstrumentId(command.songInstrumentId));

    if (!songInstrument || songInstrument.songId.value !== command.songId) {
      throw new SongInstrumentNotExistException(command.songInstrumentId);
    }

    const songInstrumentVideo = await this.songInstrumentVideoRepository.searchBySongInstrumentId(
      new SongInstrumentVideoSongInstrumentId(command.songInstrumentId)
    );

    if (!songInstrumentVideo) {
      throw new SongInstrumentVideoNotExistException(command.songInstrumentId);
    }

    const updatedSongInstrumentVideo = songInstrumentVideo.updateStartTimeMs(command.startTimeMs);
    const domainEvents = updatedSongInstrumentVideo.pullDomainEvents();

    if (domainEvents.length === 0) {
      return;
    }

    await this.songInstrumentVideoRepository.save(updatedSongInstrumentVideo);
    await this.eventBus.publish(domainEvents);
  }
}
