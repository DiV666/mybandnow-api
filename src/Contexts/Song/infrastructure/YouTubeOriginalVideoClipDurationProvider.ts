import { Nullable } from '@Contexts/Shared/domain/Nullable.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { HttpClient } from '@Contexts/Shared/infrastructure/Http/HttpClient.js';
import { OriginalVideoClipDurationProvider } from '../domain/OriginalVideoClipDurationProvider.js';

const YOUTUBE_HOSTS = new Set(['www.youtube.com', 'youtube.com', 'm.youtube.com', 'youtu.be']);

export class YouTubeOriginalVideoClipDurationProvider implements OriginalVideoClipDurationProvider {
  constructor(
    private readonly logger: Logger,
    private readonly httpClient: HttpClient
  ) {}

  async getDurationInSeconds(url: string): Promise<Nullable<number>> {
    const normalizedUrl = this.normalizeUrl(url);

    if (!normalizedUrl) {
      return null;
    }

    const page = await this.httpClient.get<string>(normalizedUrl, {
      logContext: {
        integration: 'youtube',
        operation: 'fetch-original-video-duration',
        resourceId: this.videoIdFrom(normalizedUrl) ?? undefined
      },
      headers: {
        Accept: 'text/html,application/xhtml+xml'
      }
    });

    const durationFromLengthSeconds = this.lengthSecondsFrom(page);

    if (durationFromLengthSeconds !== null) {
      return durationFromLengthSeconds;
    }

    const durationFromIso8601 = this.iso8601DurationFrom(page);

    if (durationFromIso8601 !== null) {
      return durationFromIso8601;
    }

    this.logger.warn(
      {
        provider: 'youtube',
        url: this.sanitizeUrlForLogging(normalizedUrl)
      },
      'mybandnow.song.original_video_clip_duration.unavailable'
    );

    return null;
  }

  private normalizeUrl(url: string): string | null {
    try {
      const parsedUrl = new URL(url);

      if (!YOUTUBE_HOSTS.has(parsedUrl.hostname)) {
        return null;
      }

      return parsedUrl.toString();
    } catch {
      return null;
    }
  }

  private lengthSecondsFrom(page: string): number | null {
    const matchedLengthSeconds = /"lengthSeconds"\s*:\s*"(?<seconds>\d+)"/u.exec(page)?.groups?.seconds;

    if (!matchedLengthSeconds) {
      return null;
    }

    const parsed = Number(matchedLengthSeconds);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private iso8601DurationFrom(page: string): number | null {
    const matchedDuration = /itemprop="duration"\s+content="(?<duration>PT[^"]+)"/u.exec(page)?.groups?.duration;

    if (!matchedDuration) {
      return null;
    }

    const parts = /PT(?:(?<hours>\d+)H)?(?:(?<minutes>\d+)M)?(?:(?<seconds>\d+)S)?/u.exec(matchedDuration)?.groups;

    if (!parts) {
      return null;
    }

    const hours = Number(parts.hours ?? 0);
    const minutes = Number(parts.minutes ?? 0);
    const seconds = Number(parts.seconds ?? 0);
    const total = hours * 3600 + minutes * 60 + seconds;

    return total > 0 ? total : null;
  }

  private videoIdFrom(url: string): string | null {
    try {
      const parsedUrl = new URL(url);

      if (parsedUrl.hostname === 'youtu.be') {
        return parsedUrl.pathname.replace(/^\//u, '') || null;
      }

      return parsedUrl.searchParams.get('v');
    } catch {
      return null;
    }
  }

  private sanitizeUrlForLogging(url: string): string {
    try {
      const parsedUrl = new URL(url);
      return `${parsedUrl.origin}${parsedUrl.pathname}${parsedUrl.search ? '?redacted' : ''}`;
    } catch {
      return url.split('?', 1)[0] ?? url;
    }
  }
}
