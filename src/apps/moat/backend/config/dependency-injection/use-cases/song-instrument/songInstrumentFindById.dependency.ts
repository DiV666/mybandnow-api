import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentFindById } from '@Contexts/Moat/SongInstrument/application/findById/SongInstrumentFindById.js';
import { SongInstrumentFindByIdQueryHandler } from '@Contexts/Moat/SongInstrument/application/findById/SongInstrumentFindByIdQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.SongInstrument.SongInstrumentFindById', SongInstrumentFindById)
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Moat.SongInstrumentVideo.SongInstrumentVideoRepository'));

  container
    .register('Moat.SongInstrument.SongInstrumentFindByIdQueryHandler', SongInstrumentFindByIdQueryHandler)
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentFindById'))
    .addTag('queryHandler');
}
