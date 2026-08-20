import { beforeEach, describe, expect, it } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import type Logger from '@Contexts/Shared/domain/Logger.js';
import { SongOriginalVideoClipDurationEnricher } from '@Contexts/Song/application/enrichOriginalVideoClipDuration/SongOriginalVideoClipDurationEnricher.js';
import type { OriginalVideoClipDurationProvider } from '@Contexts/Song/domain/OriginalVideoClipDurationProvider.js';
import type { SongPersistenceRepository } from '@Contexts/Song/domain/repository/SongPersistenceRepository.js';
import { SongId } from '@Contexts/Song/domain/value-object/SongId.js';
import { SongOriginalVideoClipDurationSeconds } from '@Contexts/Song/domain/value-object/SongOriginalVideoClipDurationSeconds.js';

describe('SongOriginalVideoClipDurationEnricher', () => {
  let logger: MockProxy<Logger>;
  let provider: MockProxy<OriginalVideoClipDurationProvider>;
  let repository: MockProxy<SongPersistenceRepository>;

  beforeEach(() => {
    logger = mock<Logger>();
    provider = mock<OriginalVideoClipDurationProvider>();
    repository = mock<SongPersistenceRepository>();
  });

  it('updates the song duration when the provider returns a parsed value', async () => {
    // Arrange
    const enricher = new SongOriginalVideoClipDurationEnricher(logger, provider, repository);
    provider.getDurationInSeconds.mockResolvedValue(213);

    // Act
    await enricher.run({
      songId: '12345678-1234-4234-8234-123456789012',
      originalVideoclipUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    });

    // Assert
    expect(provider.getDurationInSeconds).toHaveBeenCalledWith('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(repository.updateOriginalVideoClipDurationSeconds).toHaveBeenCalledWith(
      new SongId('12345678-1234-4234-8234-123456789012'),
      new SongOriginalVideoClipDurationSeconds(213)
    );
    expect(logger.info).toHaveBeenCalledWith(
      { songId: '12345678-1234-4234-8234-123456789012', durationInSeconds: 213 },
      'mybandnow.song.original_video_clip_duration.enriched'
    );
  });

  it('keeps the duration null when the provider cannot enrich the public page', async () => {
    // Arrange
    const enricher = new SongOriginalVideoClipDurationEnricher(logger, provider, repository);
    provider.getDurationInSeconds.mockResolvedValue(null);

    // Act
    await enricher.run({
      songId: '12345678-1234-4234-8234-123456789012',
      originalVideoclipUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    });

    // Assert
    expect(repository.updateOriginalVideoClipDurationSeconds).not.toHaveBeenCalled();
    expect(logger.info).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it('logs sanitized failure context when the provider throws', async () => {
    // Arrange
    const enricher = new SongOriginalVideoClipDurationEnricher(logger, provider, repository);
    provider.getDurationInSeconds.mockRejectedValue(new Error('network timeout'));

    // Act
    await enricher.run({
      songId: '12345678-1234-4234-8234-123456789012',
      originalVideoclipUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=private'
    });

    // Assert
    expect(repository.updateOriginalVideoClipDurationSeconds).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalledWith(
      { songId: '12345678-1234-4234-8234-123456789012', errorName: 'Error' },
      'mybandnow.song.original_video_clip_duration.enrichment_failed'
    );
  });
});
