import { VideoclipProcess } from '../../domain/VideoclipProcess.js';
import { VideoclipProcessPersistenceRepository } from '../../domain/repository/VideoclipProcessPersistenceRepository.js';
import { VideoclipProcessSongId } from '../../domain/value-object/VideoclipProcessSongId.js';
import { VideoclipProcessAlreadyRequestedException } from '../../domain/exception/VideoclipProcessAlreadyRequestedException.js';
import { IncompleteSongInstrumentsException } from '../../domain/exception/IncompleteSongInstrumentsException.js';
import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { RequestVideoclipCommand } from './RequestVideoclipCommand.js';

export class VideoclipProcessRequester {
  constructor(
    private readonly repository: VideoclipProcessPersistenceRepository,
    private readonly eventBus: EventBus
  ) {}

  async run(command: RequestVideoclipCommand): Promise<void> {
    const { id, songId, instruments } = command;

    const existingProcess = await this.repository.searchActiveBySongId(new VideoclipProcessSongId(songId));

    if (existingProcess) {
      throw new VideoclipProcessAlreadyRequestedException(songId);
    }

    const missingSongInstrumentIds = instruments
      .filter((instrument) => !instrument.videoUrl)
      .map((instrument) => instrument.songInstrumentId);

    if (instruments.length === 0 || missingSongInstrumentIds.length > 0) {
      throw new IncompleteSongInstrumentsException(songId, instruments.length === 0 ? [] : missingSongInstrumentIds);
    }

    const videoclipProcess = VideoclipProcess.request(
      id,
      songId,
      instruments.map((instrument) => ({
        songInstrumentId: instrument.songInstrumentId,
        videoUrl: instrument.videoUrl as string
      }))
    );

    await this.repository.save(videoclipProcess);
    await this.eventBus.publish(videoclipProcess.pullDomainEvents());
  }
}
