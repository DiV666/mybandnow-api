import { StorageRepository } from '../domain/StorageRepository.js';
import Logger from '../../../Shared/domain/Logger.js';
import { Storage } from '@google-cloud/storage';

export class GcsStorageRepository implements StorageRepository {
  private storage: Storage;

  constructor(
    private logger: Logger,
    private bucketName: string
  ) {
    this.storage = new Storage();
  }

  async uploadFile(localFilePath: string, destinationPath: string): Promise<void> {
    this.logger.info(
      `[GcsStorageRepository] Uploading ${localFilePath} to GCS bucket ${this.bucketName} at ${destinationPath}...`
    );
    await this.storage.bucket(this.bucketName).upload(localFilePath, {
      destination: destinationPath
    });
    this.logger.info(`[GcsStorageRepository] Uploaded successfully.`);
  }

  async deleteFile(destinationPath: string): Promise<void> {
    this.logger.info(`[GcsStorageRepository] Deleting ${destinationPath} from GCS bucket ${this.bucketName}...`);
    await this.storage.bucket(this.bucketName).file(destinationPath).delete();
    this.logger.info(`[GcsStorageRepository] Deleted successfully.`);
  }
}
