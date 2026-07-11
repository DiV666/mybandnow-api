import { FileReference } from './value-object/FileReference.js';

export interface FileSystemRepository {
  getFileSize(localFilePath: FileReference): Promise<number>;
  deleteFile(localFilePath: FileReference): Promise<void>;
}
