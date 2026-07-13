import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentProcessPrismaRepository } from '@Contexts/Orchestrator/SongInstrumentProcess/infrastructure/persistence/SongInstrumentProcessPrismaRepository.js';
import { FfmpegVideoValidationService } from '@Contexts/Orchestrator/SongInstrumentProcess/infrastructure/FfmpegVideoValidationService.js';
import { GcsStorageRepository } from '@Contexts/Orchestrator/SongInstrumentProcess/infrastructure/GcsStorageRepository.js';
import { SongInstrumentProcessValidator } from '@Contexts/Orchestrator/SongInstrumentProcess/application/SongInstrumentProcessValidator.js';
import { SongInstrumentProcessValidateCommandHandler } from '@Contexts/Orchestrator/SongInstrumentProcess/application/SongInstrumentProcessValidateCommandHandler.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';

export function registerOrchestratorDependencies(container: ContainerBuilder) {
  // Repositories & Services
  container
    .register(
      'Orchestrator.SongInstrumentProcess.SongInstrumentProcessPersistenceRepository',
      SongInstrumentProcessPrismaRepository
    )
    .addArgument(new Reference('Shared.Outbox'));

  container.register('Orchestrator.SongInstrumentProcess.VideoValidationService', FfmpegVideoValidationService);

  container
    .register('Orchestrator.SongInstrumentProcess.StorageRepository', GcsStorageRepository)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(env.GCS_BUCKET || 'mybandnow-tracks');

  // Use Cases
  container
    .register('Orchestrator.SongInstrumentProcess.SongInstrumentProcessValidator', SongInstrumentProcessValidator)
    .addArgument(new Reference('Orchestrator.SongInstrumentProcess.VideoValidationService'))
    .addArgument(new Reference('Orchestrator.SongInstrumentProcess.StorageRepository'))
    .addArgument(new Reference('Shared.FileSystemRepository'))
    .addArgument(new Reference('Orchestrator.SongInstrumentProcess.SongInstrumentProcessPersistenceRepository'))
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.EventBus'));

  // Command Handlers
  container
    .register(
      'Orchestrator.SongInstrumentProcess.SongInstrumentProcessValidateCommandHandler',
      SongInstrumentProcessValidateCommandHandler
    )
    .addArgument(new Reference('Orchestrator.SongInstrumentProcess.SongInstrumentProcessValidator'))
    .addTag('commandHandler');
}
