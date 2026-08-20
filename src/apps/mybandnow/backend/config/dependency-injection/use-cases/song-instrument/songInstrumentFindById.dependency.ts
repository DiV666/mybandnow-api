import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentFindById } from '@Contexts/SongInstrument/SongInstrument/application/findById/SongInstrumentFindById.js';
import { SongInstrumentFindByIdQueryHandler } from '@Contexts/SongInstrument/SongInstrument/application/findById/SongInstrumentFindByIdQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.SongInstrument.SongInstrumentFindById', SongInstrumentFindById)
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('SongInstrument.Video.SongInstrumentVideoRepository'))
    .addArgument(new Reference('SongInstrument.Upload.SongInstrumentUploadRepository'))
    .addArgument(new Reference('Shared.StorageRepository'));

  container
    .register('SongInstrument.SongInstrument.SongInstrumentFindByIdQueryHandler', SongInstrumentFindByIdQueryHandler)
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentFindById'))
    .addTag('queryHandler');
}
