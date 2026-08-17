import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentUploadUrlRequester } from '@Contexts/SongInstrument/Upload/application/requestUploadUrl/SongInstrumentUploadUrlRequester.js';
import { SongInstrumentUploadRequestUploadUrlQueryHandler } from '@Contexts/SongInstrument/Upload/application/requestUploadUrl/SongInstrumentUploadRequestUploadUrlQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.Upload.SongInstrumentUploadUrlRequester', SongInstrumentUploadUrlRequester)
    .addArgument(new Reference('SongInstrument.Upload.SongInstrumentUploadRepository'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Shared.StorageRepository'))
    .addArgument(new Reference('Shared.Clock'));

  container
    .register(
      'SongInstrument.Upload.SongInstrumentUploadRequestUploadUrlQueryHandler',
      SongInstrumentUploadRequestUploadUrlQueryHandler
    )
    .addArgument(new Reference('SongInstrument.Upload.SongInstrumentUploadUrlRequester'))
    .addTag('queryHandler');
}
