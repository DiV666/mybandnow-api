import { beforeEach, describe, expect, it } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import type Logger from '../../../../../src/Contexts/Shared/domain/Logger.js';
import { YouTubeOriginalVideoClipDurationProvider } from '../../../../../src/Contexts/Song/infrastructure/YouTubeOriginalVideoClipDurationProvider.js';
import { HttpClient } from '../../../../../src/Contexts/Shared/infrastructure/Http/HttpClient.js';

describe('YouTubeOriginalVideoClipDurationProvider', () => {
  let logger: MockProxy<Logger>;
  let httpClient: MockProxy<HttpClient>;

  beforeEach(() => {
    logger = mock<Logger>();
    httpClient = mock<HttpClient>();
  });

  it('returns the video duration parsed from the public YouTube page lengthSeconds metadata', async () => {
    // Arrange
    const provider = new YouTubeOriginalVideoClipDurationProvider(logger, httpClient);
    httpClient.get.mockResolvedValue(
      `<!doctype html><script>var ytInitialPlayerResponse = {\"videoDetails\":{\"lengthSeconds\":\"213\"}};</script>`
    );

    // Act
    const duration = await provider.getDurationInSeconds('https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    // Assert
    expect(duration).toBe(213);
    expect(httpClient.get).toHaveBeenCalledWith('https://www.youtube.com/watch?v=dQw4w9WgXcQ', expect.any(Object));
  });

  it('falls back to ISO-8601 duration metadata when lengthSeconds is unavailable', async () => {
    // Arrange
    const provider = new YouTubeOriginalVideoClipDurationProvider(logger, httpClient);
    httpClient.get.mockResolvedValue(
      '<html><head><meta itemprop="duration" content="PT1H2M3S"></head><body></body></html>'
    );

    // Act
    const duration = await provider.getDurationInSeconds('https://youtu.be/dQw4w9WgXcQ');

    // Assert
    expect(duration).toBe(3723);
  });

  it('returns null and logs sanitized context when the public page cannot be parsed', async () => {
    // Arrange
    const provider = new YouTubeOriginalVideoClipDurationProvider(logger, httpClient);
    httpClient.get.mockResolvedValue('<html><body>missing metadata</body></html>');

    // Act
    const duration = await provider.getDurationInSeconds('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=private');

    // Assert
    expect(duration).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: 'youtube',
        url: 'https://www.youtube.com/watch?redacted'
      }),
      'moat.song.original_video_clip_duration.unavailable'
    );
  });
});
