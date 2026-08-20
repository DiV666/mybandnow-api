import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentUploadStatusUpdater } from '@Contexts/SongInstrument/Upload/application/updateStatus/SongInstrumentUploadStatusUpdater.js';
import { SongInstrumentUploadUpdateStatusCommandHandler } from '@Contexts/SongInstrument/Upload/application/updateStatus/SongInstrumentUploadUpdateStatusCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.Upload.SongInstrumentUploadStatusUpdater', SongInstrumentUploadStatusUpdater)
    .addArgument(new Reference('SongInstrument.Upload.SongInstrumentUploadRepository'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register(
      'SongInstrument.Upload.SongInstrumentUploadUpdateStatusCommandHandler',
      SongInstrumentUploadUpdateStatusCommandHandler
    )
    .addArgument(new Reference('SongInstrument.Upload.SongInstrumentUploadStatusUpdater'))
    .addTag('commandHandler');
}
