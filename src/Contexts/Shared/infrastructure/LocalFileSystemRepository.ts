import { FileSystemRepository } from '../domain/FileSystemRepository.js';
import fs from 'fs/promises';
import { FileReference } from '../domain/value-object/FileReference.js';

export class LocalFileSystemRepository implements FileSystemRepository {
  async getFileSize(localFilePath: FileReference): Promise<number> {
    const fileStat = await fs.stat(localFilePath.value);
    return fileStat.size;
  }

  async deleteFile(localFilePath: FileReference): Promise<void> {
    try {
      await fs.unlink(localFilePath.value);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }
}
