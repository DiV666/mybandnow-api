import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { TrackProcessPrismaRepository } from '@Contexts/Orchestrator/TrackProcess/infrastructure/persistence/TrackProcessPrismaRepository.js';
import { FfmpegVideoValidationService } from '@Contexts/Orchestrator/TrackProcess/infrastructure/FfmpegVideoValidationService.js';
import { GcsStorageRepository } from '@Contexts/Orchestrator/TrackProcess/infrastructure/GcsStorageRepository.js';
import { TrackProcessValidator } from '@Contexts/Orchestrator/TrackProcess/application/TrackProcessValidator.js';
import { TrackProcessValidateCommandHandler } from '@Contexts/Orchestrator/TrackProcess/application/TrackProcessValidateCommandHandler.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';

export function registerOrchestratorDependencies(container: ContainerBuilder) {
  // Repositories & Services
  container
    .register('Orchestrator.TrackProcess.TrackProcessPersistenceRepository', TrackProcessPrismaRepository)
    .addArgument(new Reference('Shared.Outbox'));

  container.register('Orchestrator.TrackProcess.VideoValidationService', FfmpegVideoValidationService);

  container
    .register('Orchestrator.TrackProcess.StorageRepository', GcsStorageRepository)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(env.GCS_BUCKET || 'mybandnow-tracks');

  // Use Cases
  container
    .register('Orchestrator.TrackProcess.TrackProcessValidator', TrackProcessValidator)
    .addArgument(new Reference('Orchestrator.TrackProcess.VideoValidationService'))
    .addArgument(new Reference('Orchestrator.TrackProcess.StorageRepository'))
    .addArgument(new Reference('Shared.FileSystemRepository'))
    .addArgument(new Reference('Orchestrator.TrackProcess.TrackProcessPersistenceRepository'))
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.EventBus'));

  // Command Handlers
  container
    .register('Orchestrator.TrackProcess.TrackProcessValidateCommandHandler', TrackProcessValidateCommandHandler)
    .addArgument(new Reference('Orchestrator.TrackProcess.TrackProcessValidator'))
    .addTag('commandHandler');
}
