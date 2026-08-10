import Logger from '@Contexts/Shared/domain/Logger.js';
import { SongId } from '../../domain/value-object/SongId.js';
import { SongOriginalVideoClipDurationSeconds } from '../../domain/value-object/SongOriginalVideoClipDurationSeconds.js';
import { SongPersistenceRepository } from '../../domain/repository/SongPersistenceRepository.js';
import { OriginalVideoClipDurationProvider } from '../../domain/OriginalVideoClipDurationProvider.js';

export class SongOriginalVideoClipDurationEnricher {
  constructor(
    private readonly logger: Logger,
    private readonly provider: OriginalVideoClipDurationProvider,
    private readonly repository: SongPersistenceRepository
  ) {}

  async run(command: { songId: string; originalVideoclipUrl: string }): Promise<void> {
    try {
      const durationInSeconds = await this.provider.getDurationInSeconds(command.originalVideoclipUrl);

      if (durationInSeconds === null) {
        return;
      }

      await this.repository.updateOriginalVideoClipDurationSeconds(
        new SongId(command.songId),
        new SongOriginalVideoClipDurationSeconds(durationInSeconds)
      );
      this.logger.info(
        { songId: command.songId, durationInSeconds },
        'moat.song.original_video_clip_duration.enriched'
      );
    } catch (error: unknown) {
      this.logger.warn(
        {
          songId: command.songId,
          errorName: error instanceof Error ? error.name : 'UnknownError'
        },
        'moat.song.original_video_clip_duration.enrichment_failed'
      );
    }
  }
}
