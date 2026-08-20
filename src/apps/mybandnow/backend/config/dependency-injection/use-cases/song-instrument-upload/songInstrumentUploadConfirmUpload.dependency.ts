import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentUploadConfirmer } from '@Contexts/SongInstrument/Upload/application/confirmUpload/SongInstrumentUploadConfirmer.js';
import { SongInstrumentUploadConfirmUploadCommandHandler } from '@Contexts/SongInstrument/Upload/application/confirmUpload/SongInstrumentUploadConfirmUploadCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.Upload.SongInstrumentUploadConfirmer', SongInstrumentUploadConfirmer)
    .addArgument(new Reference('SongInstrument.Upload.SongInstrumentUploadRepository'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Shared.StorageRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register(
      'SongInstrument.Upload.SongInstrumentUploadConfirmUploadCommandHandler',
      SongInstrumentUploadConfirmUploadCommandHandler
    )
    .addArgument(new Reference('SongInstrument.Upload.SongInstrumentUploadConfirmer'))
    .addTag('commandHandler');
}
