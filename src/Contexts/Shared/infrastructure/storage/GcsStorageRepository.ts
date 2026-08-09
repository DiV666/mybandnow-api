import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { Storage } from '@google-cloud/storage';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { StorageRepository } from '@Contexts/Shared/domain/StorageRepository.js';

const PLAYBACK_SIGNED_URL_TTL_IN_MS = 15 * 60 * 1000;

export class GcsStorageRepository implements StorageRepository {
  private readonly storage: Storage;

  constructor(
    private readonly logger: Logger,
    private readonly bucketName: string,
    clientEmail: string,
    privateKeyBase64: string
  ) {
    const privateKey = Buffer.from(privateKeyBase64, 'base64').toString('utf8');

    this.storage = new Storage({
      credentials: {
        client_email: clientEmail,
        private_key: privateKey
      }
    });
  }

  async uploadFile(localFilePath: string, destinationPath: string): Promise<void> {
    this.logger.info(`[GcsStorageRepository] Uploading file to GCS bucket ${this.bucketName} at ${destinationPath}...`);
    await this.storage.bucket(this.bucketName).upload(localFilePath, {
      destination: destinationPath
    });
    this.logger.info('[GcsStorageRepository] Uploaded successfully.');
  }

  async downloadFileToTemp(sourcePath: string): Promise<string> {
    const tempFilePath = path.join(
      os.tmpdir(),
      `song-instrument-process_${randomUUID()}${path.extname(sourcePath) || '.mp4'}`
    );

    this.logger.info(`[GcsStorageRepository] Downloading file from GCS bucket ${this.bucketName} at ${sourcePath}...`);
    await this.storage.bucket(this.bucketName).file(sourcePath).download({ destination: tempFilePath });
    this.logger.info('[GcsStorageRepository] Downloaded successfully.');

    return tempFilePath;
  }

  async getSignedUrl(sourcePath: string): Promise<string> {
    this.logger.info(
      `[GcsStorageRepository] Generating signed url for ${sourcePath} from GCS bucket ${this.bucketName}...`
    );
    const [signedUrl] = await this.storage
      .bucket(this.bucketName)
      .file(sourcePath)
      .getSignedUrl({
        action: 'read',
        expires: Date.now() + PLAYBACK_SIGNED_URL_TTL_IN_MS
      });
    this.logger.info('[GcsStorageRepository] Signed url generated successfully.');

    return signedUrl;
  }

  async deleteFile(destinationPath: string): Promise<void> {
    this.logger.info(`[GcsStorageRepository] Deleting ${destinationPath} from GCS bucket ${this.bucketName}...`);
    await this.storage.bucket(this.bucketName).file(destinationPath).delete();
    this.logger.info('[GcsStorageRepository] Deleted successfully.');
  }
}
