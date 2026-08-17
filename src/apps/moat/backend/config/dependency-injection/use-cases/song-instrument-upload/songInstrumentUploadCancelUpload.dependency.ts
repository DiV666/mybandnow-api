import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentUploadCanceller } from '@Contexts/SongInstrument/Upload/application/cancelUpload/SongInstrumentUploadCanceller.js';
import { SongInstrumentUploadCancelUploadCommandHandler } from '@Contexts/SongInstrument/Upload/application/cancelUpload/SongInstrumentUploadCancelUploadCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.Upload.SongInstrumentUploadCanceller', SongInstrumentUploadCanceller)
    .addArgument(new Reference('SongInstrument.Upload.SongInstrumentUploadRepository'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Shared.StorageRepository'));

  container
    .register(
      'SongInstrument.Upload.SongInstrumentUploadCancelUploadCommandHandler',
      SongInstrumentUploadCancelUploadCommandHandler
    )
    .addArgument(new Reference('SongInstrument.Upload.SongInstrumentUploadCanceller'))
    .addTag('commandHandler');
}
