import { ContainerBuilder } from 'node-dependency-injection';
import type { StorageRepository } from '@Contexts/Orchestrator/SongInstrumentProcess/domain/StorageRepository.js';
import { InMemorySyncEventBus } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/InMemory/InMemorySyncEventBus.js';
import { PrismaEnvironmentArranger } from '../../../../../../utils/arranger/PrismaEnvironmentArranger.js';

class InMemorySongInstrumentStorageRepository implements StorageRepository {
  private readonly files = new Map<string, string>();

  async uploadFile(localFilePath: string, destinationPath: string): Promise<void> {
    this.files.set(destinationPath, localFilePath);
  }

  async downloadFileToTemp(sourcePath: string): Promise<string> {
    const filePath = this.files.get(sourcePath);

    if (!filePath) {
      throw new Error(`No such object: test-bucket/${sourcePath}`);
    }

    return filePath;
  }

  async getSignedUrl(sourcePath: string): Promise<string> {
    if (!this.files.has(sourcePath)) {
      throw new Error(`No such object: test-bucket/${sourcePath}`);
    }

    return `https://storage.googleapis.com/test-bucket/${sourcePath}?signature=test`;
  }

  async deleteFile(destinationPath: string): Promise<void> {
    if (!this.files.delete(destinationPath)) {
      throw new Error(`No such object: test-bucket/${destinationPath}`);
    }
  }

  clear(): void {
    this.files.clear();
  }
}

export function registerTestDependencies(container: ContainerBuilder): void {
  container.register('Shared.PrismaEnvironmentArranger', PrismaEnvironmentArranger);

  container.register('Shared.EventBus', InMemorySyncEventBus);
  container.register('Orchestrator.SongInstrumentProcess.StorageRepository', InMemorySongInstrumentStorageRepository);
}
