import ffmpeg from 'fluent-ffmpeg';
import { VideoValidationService, VideoMetadata } from '../domain/VideoValidationService.js';

export class FfmpegVideoValidationService implements VideoValidationService {
  async validate(tempFilePath: string): Promise<VideoMetadata> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
        if (err) {
          return reject(new Error(`Error parsing video with ffprobe: ${err.message}`));
        }

        const videoStream = metadata.streams.find((s) => s.codec_type === 'video');

        if (!videoStream) {
          return reject(new Error('No video stream found in the file'));
        }

        const codec = videoStream.codec_name || 'unknown';
        const duration = parseFloat(String(videoStream.duration || metadata.format.duration || '0'));

        resolve({
          codec,
          durationInSeconds: duration,
          width: videoStream.width || 0,
          height: videoStream.height || 0
        });
      });
    });
  }
}
