import { afterEach, describe, expect, it, vi } from 'vitest';
import fsNode from 'node:fs';
import { PassThrough, Writable } from 'node:stream';
import { promises as fs } from 'node:fs';
import type { Request } from 'express';
import { InvalidArgumentException } from '../../../../../../src/Contexts/Shared/domain/exceptions/InvalidArgumentException.js';
import { MultipartFileParser } from '../../../../../../src/Contexts/Shared/infrastructure/Express/MultipartFileParser.js';

describe('MultipartFileParser', () => {
  const createdFiles: string[] = [];

  afterEach(async () => {
    await Promise.all(
      createdFiles.splice(0).map(async (filePath) => {
        await fs.unlink(filePath).catch(() => undefined);
      })
    );
  });

  it('stores a valid mp4 upload in a temporary file', async () => {
    // Arrange
    const parser = new MultipartFileParser();
    const request = createMultipartRequest({
      boundary: 'test-boundary',
      parts: [
        {
          name: 'video',
          filename: 'track.mp4',
          contentType: 'video/mp4',
          body: Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex')
        }
      ]
    });

    // Act
    const result = await parser.parse(request as unknown as Request);
    createdFiles.push(result.tempFilePath);
    const persistedContent = await fs.readFile(result.tempFilePath);

    // Assert
    expect(result.tempFilePath).toContain('upload_');
    expect(persistedContent.equals(Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex'))).toBe(true);
  });

  it('accepts a valid mp4 upload when the ftyp signature spans multiple chunks', async () => {
    // Arrange
    const parser = new MultipartFileParser();
    const validMp4 = Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex');
    const request = createMultipartRequest({
      boundary: 'test-boundary',
      parts: [
        {
          name: 'video',
          filename: 'track.mp4',
          contentType: 'video/mp4',
          body: [validMp4.subarray(0, 6), validMp4.subarray(6)]
        }
      ]
    });

    // Act
    const result = await parser.parse(request as unknown as Request);
    createdFiles.push(result.tempFilePath);
    const persistedContent = await fs.readFile(result.tempFilePath);

    // Assert
    expect(persistedContent.equals(validMp4)).toBe(true);
  });

  it('rejects the upload when the multipart payload does not contain the video field', async () => {
    // Arrange
    const parser = new MultipartFileParser();
    const request = createMultipartRequest({
      boundary: 'test-boundary',
      parts: [
        {
          name: 'file',
          filename: 'track.mp4',
          contentType: 'video/mp4',
          body: Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex')
        }
      ]
    });

    // Act / Assert
    await expect(parser.parse(request as unknown as Request)).rejects.toEqual(
      expect.objectContaining<Partial<InvalidArgumentException>>({ message: 'No video file provided' })
    );
  });

  it('rejects the upload when the mime type is not mp4', async () => {
    // Arrange
    const parser = new MultipartFileParser();
    const request = createMultipartRequest({
      boundary: 'test-boundary',
      parts: [
        {
          name: 'video',
          filename: 'track.txt',
          contentType: 'text/plain',
          body: Buffer.from('not-an-mp4')
        }
      ]
    });

    // Act / Assert
    await expect(parser.parse(request as unknown as Request)).rejects.toEqual(
      expect.objectContaining<Partial<InvalidArgumentException>>({ message: 'Content-Type must be video/mp4' })
    );
  });

  it('cleans up the temp file when the mp4 header is invalid after the temp file was created', async () => {
    // Arrange
    const parser = new MultipartFileParser();
    const unlinkSpy = vi.spyOn(fs, 'unlink').mockResolvedValue(undefined);
    const request = createMultipartRequest({
      boundary: 'test-boundary',
      parts: [
        {
          name: 'video',
          filename: 'track.mp4',
          contentType: 'video/mp4',
          body: Buffer.from('00000018626164686561646572', 'hex')
        }
      ]
    });

    // Act / Assert
    await expect(parser.parse(request as unknown as Request)).rejects.toEqual(
      expect.objectContaining<Partial<InvalidArgumentException>>({ message: 'Invalid file format or corrupted header' })
    );
    expect(unlinkSpy).toHaveBeenCalledOnce();

    unlinkSpy.mockRestore();
  });

  it('waits for the temp file stream to finish before resolving', async () => {
    // Arrange
    const parser = new MultipartFileParser();
    let releaseFinal: (() => void) | undefined;
    const createWriteStreamSpy = vi.spyOn(fsModule, 'createWriteStream').mockImplementation(() => {
      return new Writable({
        write(_chunk, _encoding, callback) {
          callback();
        },
        final(callback) {
          releaseFinal = callback;
        }
      }) as fsNode.WriteStream;
    });
    const request = createMultipartRequest({
      boundary: 'test-boundary',
      parts: [
        {
          name: 'video',
          filename: 'track.mp4',
          contentType: 'video/mp4',
          body: Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex')
        }
      ]
    });

    // Act
    let resolved = false;
    const parsePromise = parser.parse(request as unknown as Request).then((result) => {
      resolved = true;
      return result;
    });
    await new Promise((resolve) => setTimeout(resolve, 0));

    // Assert
    expect(resolved).toBe(false);

    releaseFinal?.();
    await expect(parsePromise).resolves.toEqual(expect.objectContaining({ tempFilePath: expect.any(String) }));
    createWriteStreamSpy.mockRestore();
  });

  it('rejects the upload when the file exceeds the configured size limit', async () => {
    // Arrange
    const parser = new MultipartFileParser({ maxFileSizeBytes: 8 });
    const request = createMultipartRequest({
      boundary: 'test-boundary',
      parts: [
        {
          name: 'video',
          filename: 'track.mp4',
          contentType: 'video/mp4',
          body: Buffer.from('000000186674797069736f6d0000020069736f6d69736f32', 'hex')
        }
      ]
    });

    // Act / Assert
    await expect(parser.parse(request as unknown as Request)).rejects.toEqual(
      expect.objectContaining<Partial<InvalidArgumentException>>({ message: 'Video file exceeds the 8 byte limit' })
    );
  });

  it('rejects the upload gracefully when the client aborts the request', async () => {
    // Arrange
    const parser = new MultipartFileParser();
    const request = new PassThrough() as PassThrough & {
      headers: Record<string, string>;
      aborted?: boolean;
    };
    request.headers = {
      'content-type': 'multipart/form-data; boundary=test-boundary'
    };

    const parsePromise = parser.parse(request as unknown as Request);

    // Act
    request.write('--test-boundary\r\n');
    request.write('Content-Disposition: form-data; name="video"; filename="track.mp4"\r\n');
    request.write('Content-Type: video/mp4\r\n\r\n');
    request.write(Buffer.from('000000186674', 'hex'));
    request.aborted = true;
    request.emit('aborted');
    request.destroy();

    // Assert
    const outcome = await Promise.race([
      parsePromise.then(
        () => 'resolved',
        (error) => error
      ),
      new Promise((resolve) => setTimeout(() => resolve('timeout'), 100))
    ]);

    expect(outcome).toEqual(
      expect.objectContaining<Partial<InvalidArgumentException>>({ message: 'Upload aborted by client' })
    );
  });
});

type MultipartPart = {
  name: string;
  filename: string;
  contentType: string;
  body: Buffer | Buffer[];
};

const fsModule = fsNode;

function createMultipartRequest({
  boundary,
  parts
}: {
  boundary: string;
  parts: MultipartPart[];
}): PassThrough & { headers: Record<string, string> } {
  const request = new PassThrough() as PassThrough & { headers: Record<string, string> };
  request.headers = {
    'content-type': `multipart/form-data; boundary=${boundary}`
  };

  for (const part of parts) {
    request.write(`--${boundary}\r\n`);
    request.write(
      `Content-Disposition: form-data; name="${part.name}"; filename="${part.filename}"\r\nContent-Type: ${part.contentType}\r\n\r\n`
    );
    const bodyChunks = Array.isArray(part.body) ? part.body : [part.body];
    for (const chunk of bodyChunks) {
      request.write(chunk);
    }
    request.write('\r\n');
  }

  request.end(`--${boundary}--\r\n`);

  return request;
}
