import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentUploadStatusUpdater } from '@Contexts/Moat/SongInstrumentUpload/application/updateStatus/SongInstrumentUploadStatusUpdater.js';
import { SongInstrumentUploadUpdateStatusCommandHandler } from '@Contexts/Moat/SongInstrumentUpload/application/updateStatus/SongInstrumentUploadUpdateStatusCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.SongInstrumentUpload.SongInstrumentUploadStatusUpdater', SongInstrumentUploadStatusUpdater)
    .addArgument(new Reference('Moat.SongInstrumentUpload.SongInstrumentUploadRepository'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register(
      'Moat.SongInstrumentUpload.SongInstrumentUploadUpdateStatusCommandHandler',
      SongInstrumentUploadUpdateStatusCommandHandler
    )
    .addArgument(new Reference('Moat.SongInstrumentUpload.SongInstrumentUploadStatusUpdater'))
    .addTag('commandHandler');
}
