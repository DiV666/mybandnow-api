import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { Storage } from '@google-cloud/storage';
import Logger from '../../../Shared/domain/Logger.js';
import { StorageRepository } from '../domain/StorageRepository.js';

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

  async deleteFile(destinationPath: string): Promise<void> {
    this.logger.info(`[GcsStorageRepository] Deleting ${destinationPath} from GCS bucket ${this.bucketName}...`);
    await this.storage.bucket(this.bucketName).file(destinationPath).delete();
    this.logger.info('[GcsStorageRepository] Deleted successfully.');
  }
}
