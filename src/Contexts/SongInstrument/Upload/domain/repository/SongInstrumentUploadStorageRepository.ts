export interface SongInstrumentUploadStorageRepository {
  getWriteSignedUrl(destinationPath: string, contentType: string): Promise<string>;
  fileExists(path: string): Promise<boolean>;
  deleteFile(path: string): Promise<void>;
}
