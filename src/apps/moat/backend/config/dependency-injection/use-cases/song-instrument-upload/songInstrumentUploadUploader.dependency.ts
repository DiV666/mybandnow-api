import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentUploadUploader } from '@Contexts/SongInstrument/Upload/application/upload/SongInstrumentUploadUploader.js';
import { SongInstrumentUploadUploadCommandHandler } from '@Contexts/SongInstrument/Upload/application/upload/SongInstrumentUploadUploadCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.Upload.SongInstrumentUploadUploader', SongInstrumentUploadUploader)
    .addArgument(new Reference('SongInstrument.Upload.SongInstrumentUploadRepository'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Shared.StorageRepository'))
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.EventBus'))
    .addArgument(new Reference('Shared.Clock'));

  container
    .register(
      'SongInstrument.Upload.SongInstrumentUploadUploadCommandHandler',
      SongInstrumentUploadUploadCommandHandler
    )
    .addArgument(new Reference('SongInstrument.Upload.SongInstrumentUploadUploader'))
    .addTag('commandHandler');
}
