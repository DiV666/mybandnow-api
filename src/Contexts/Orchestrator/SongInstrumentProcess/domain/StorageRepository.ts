export interface StorageRepository {
  uploadFile(localFilePath: string, destinationPath: string): Promise<void>;
  downloadFileToTemp(sourcePath: string): Promise<string>;
  deleteFile(destinationPath: string): Promise<void>;
}
