import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Storage } from '@google-cloud/storage';
import type Logger from '../../../../../../src/Contexts/Shared/domain/Logger.js';
import { GcsStorageRepository } from '../../../../../../src/Contexts/Orchestrator/SongInstrumentProcess/infrastructure/GcsStorageRepository.js';

const storageMocks = vi.hoisted(() => {
  const upload = vi.fn();
  const deleteFile = vi.fn();
  const download = vi.fn();
  const getSignedUrl = vi.fn();
  const file = vi.fn(() => ({
    delete: deleteFile,
    download,
    getSignedUrl
  }));
  const bucket = vi.fn(() => ({
    upload,
    file
  }));
  const constructorSpy = vi.fn();
  const StorageMock = vi.fn(function (this: unknown, ...args: unknown[]) {
    constructorSpy(...args);
    return {
      bucket
    };
  });

  return {
    upload,
    deleteFile,
    download,
    getSignedUrl,
    file,
    bucket,
    constructorSpy,
    StorageMock
  };
});

vi.mock('@google-cloud/storage', () => ({
  Storage: storageMocks.StorageMock
}));

describe('GcsStorageRepository', () => {
  let logger: Logger;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    storageMocks.upload.mockReset();
    storageMocks.deleteFile.mockReset();
    storageMocks.download.mockReset();
    storageMocks.getSignedUrl.mockReset();
    storageMocks.file.mockClear();
    storageMocks.bucket.mockClear();
    storageMocks.constructorSpy.mockClear();
    storageMocks.StorageMock.mockClear();
    logger = {
      info: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
      warn: vi.fn()
    };
  });

  it('decodes the base64 service account secret when creating the GCS client', () => {
    const repository = new GcsStorageRepository(
      logger,
      'tmp-bucket',
      'service-account@example.com',
      Buffer.from('private-key').toString('base64')
    );

    expect(repository).toBeInstanceOf(GcsStorageRepository);
    expect(Storage).toHaveBeenCalledWith({
      credentials: {
        client_email: 'service-account@example.com',
        private_key: 'private-key'
      }
    });
  });

  it('returns a short-lived signed playback url for a durable GCS object', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
    storageMocks.getSignedUrl.mockResolvedValue([
      'https://storage.googleapis.com/tmp-bucket/song-instrument-uploads/video.mp4?signature=123'
    ]);
    const repository = new GcsStorageRepository(
      logger,
      'tmp-bucket',
      'service-account@example.com',
      Buffer.from('private-key').toString('base64')
    );

    const signedUrl = await repository.getSignedUrl('song-instrument-uploads/video.mp4');

    expect(storageMocks.bucket).toHaveBeenCalledWith('tmp-bucket');
    expect(storageMocks.file).toHaveBeenCalledWith('song-instrument-uploads/video.mp4');
    expect(storageMocks.getSignedUrl).toHaveBeenCalledExactlyOnceWith({
      action: 'read',
      expires: 1_700_000_900_000
    });
    expect(signedUrl).toBe('https://storage.googleapis.com/tmp-bucket/song-instrument-uploads/video.mp4?signature=123');
  });

  it('downloads a durable GCS object into a temp local file', async () => {
    storageMocks.download.mockResolvedValue(undefined);
    const repository = new GcsStorageRepository(
      logger,
      'tmp-bucket',
      'service-account@example.com',
      Buffer.from('private-key').toString('base64')
    );

    const tempFilePath = await repository.downloadFileToTemp('instrument-videos/song/instrument/upload.mp4');

    expect(storageMocks.bucket).toHaveBeenCalledWith('tmp-bucket');
    expect(storageMocks.file).toHaveBeenCalledWith('instrument-videos/song/instrument/upload.mp4');
    expect(storageMocks.download).toHaveBeenCalledWith({ destination: tempFilePath });
    expect(tempFilePath).toMatch(/^\/tmp\/song-instrument-process_/);
    expect(tempFilePath).toMatch(/\.mp4$/);
  });
});
