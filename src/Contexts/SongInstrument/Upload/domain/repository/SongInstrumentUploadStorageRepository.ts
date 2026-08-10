export interface SongInstrumentUploadStorageRepository {
  uploadFile(localFilePath: string, destinationPath: string): Promise<void>;
  deleteFile(destinationPath: string): Promise<void>;
}
