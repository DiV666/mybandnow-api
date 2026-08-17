export interface StorageRepository {
  uploadFile(localFilePath: string, destinationPath: string): Promise<void>;
  downloadFileToTemp(sourcePath: string): Promise<string>;
  getSignedUrl(sourcePath: string): Promise<string>;
  getWriteSignedUrl(destinationPath: string, contentType: string): Promise<string>;
  fileExists(path: string): Promise<boolean>;
  deleteFile(destinationPath: string): Promise<void>;
}
