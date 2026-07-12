import busboy from 'busboy';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { promises as fsPromises } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import type { Request } from 'express';
import { InvalidArgumentException } from '../../domain/exceptions/InvalidArgumentException.js';

const DEFAULT_MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

export interface MultipartFileResult {
  tempFilePath: string;
}

export interface MultipartFileParserOptions {
  maxFileSizeBytes?: number;
}

export class MultipartFileParser {
  private readonly maxFileSizeBytes: number;

  constructor(options: MultipartFileParserOptions = {}) {
    this.maxFileSizeBytes = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;
  }

  parse(req: Request): Promise<MultipartFileResult> {
    return new Promise((resolve, reject) => {
      const parser = busboy({
        headers: req.headers,
        limits: {
          files: 1,
          fileSize: this.maxFileSizeBytes
        }
      });
      let tempFilePath = '';
      let settled = false;
      let hasVideoFile = false;
      let parserFinished = false;
      let writeFinished = false;
      let writeStream: fs.WriteStream | undefined;

      const cleanupTempFile = (): void => {
        if (tempFilePath) {
          void fsPromises.unlink(tempFilePath).catch(() => undefined);
        }
      };

      const rejectOnce = (error: unknown): void => {
        if (settled) {
          return;
        }

        settled = true;

        if (writeStream && !writeStream.destroyed) {
          writeStream.destroy();
        }

        cleanupTempFile();

        reject(error);
      };

      const resolveOnce = (result: MultipartFileResult): void => {
        if (settled) {
          return;
        }

        settled = true;
        resolve(result);
      };

      const resolveIfReady = (): void => {
        if (!parserFinished || !writeFinished || !tempFilePath) {
          return;
        }

        resolveOnce({ tempFilePath });
      };

      const invalidArgument = (message: string): InvalidArgumentException =>
        new InvalidArgumentException({ code: 'INVALID_ARGUMENT', message });

      req.on('aborted', () => {
        rejectOnce(invalidArgument('Upload aborted by client'));
      });

      parser.on('file', (name, file, info) => {
        if (name !== 'video') {
          file.resume();
          return;
        }

        hasVideoFile = true;

        if (info.mimeType !== 'video/mp4') {
          file.resume();
          rejectOnce(invalidArgument('Content-Type must be video/mp4'));
          return;
        }

        tempFilePath = path.join(os.tmpdir(), `upload_${Date.now()}_${randomUUID()}.mp4`);
        writeStream = fs.createWriteStream(tempFilePath);
        const currentWriteStream = writeStream;

        let headerBuffer = Buffer.alloc(0);
        let headerValidated = false;

        file.on('data', (data: Buffer) => {
          if (settled) {
            return;
          }

          if (!headerValidated) {
            headerBuffer = Buffer.concat([headerBuffer, data]);

            if (headerBuffer.length < 8) {
              return;
            }

            const ftyp = headerBuffer.toString('ascii', 4, 8);
            if (ftyp !== 'ftyp') {
              file.resume();
              rejectOnce(invalidArgument('Invalid file format or corrupted header'));
              return;
            }

            headerValidated = true;
            currentWriteStream.write(headerBuffer);
            headerBuffer = Buffer.alloc(0);
            return;
          }

          currentWriteStream.write(data);
        });

        file.on('limit', () => {
          file.resume();
          rejectOnce(invalidArgument(`Video file exceeds the ${this.maxFileSizeBytes} byte limit`));
        });

        file.on('end', () => {
          if (!headerValidated && !settled) {
            rejectOnce(invalidArgument('Invalid file format or corrupted header'));
            return;
          }

          currentWriteStream.end();
        });

        currentWriteStream.on('error', (error) => {
          rejectOnce(error);
        });

        currentWriteStream.on('finish', () => {
          writeFinished = true;
          resolveIfReady();
        });
      });

      parser.on('finish', () => {
        parserFinished = true;

        if (!hasVideoFile) {
          rejectOnce(invalidArgument('No video file provided'));
          return;
        }

        resolveIfReady();
      });

      parser.on('error', (error) => {
        rejectOnce(error);
      });

      req.pipe(parser);
    });
  }
}
