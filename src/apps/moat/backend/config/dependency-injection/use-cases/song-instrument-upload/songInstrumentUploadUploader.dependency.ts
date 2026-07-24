import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentUploadUploader } from '@Contexts/Moat/SongInstrumentUpload/application/upload/SongInstrumentUploadUploader.js';
import { SongInstrumentUploadUploadCommandHandler } from '@Contexts/Moat/SongInstrumentUpload/application/upload/SongInstrumentUploadUploadCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.SongInstrumentUpload.SongInstrumentUploadUploader', SongInstrumentUploadUploader)
    .addArgument(new Reference('Moat.SongInstrumentUpload.SongInstrumentUploadRepository'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Orchestrator.SongInstrumentProcess.StorageRepository'))
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.EventBus'))
    .addArgument(new Reference('Shared.Clock'));

  container
    .register(
      'Moat.SongInstrumentUpload.SongInstrumentUploadUploadCommandHandler',
      SongInstrumentUploadUploadCommandHandler
    )
    .addArgument(new Reference('Moat.SongInstrumentUpload.SongInstrumentUploadUploader'))
    .addTag('commandHandler');
}
