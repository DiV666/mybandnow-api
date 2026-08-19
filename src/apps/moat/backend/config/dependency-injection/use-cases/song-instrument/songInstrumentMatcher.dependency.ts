import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentMatcher } from '@Contexts/SongInstrument/SongInstrument/application/matchByCriteria/SongInstrumentMatcher.js';
import { MatchByCriteriaSongInstrumentQueryHandler } from '@Contexts/SongInstrument/SongInstrument/application/matchByCriteria/MatchByCriteriaSongInstrumentQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.SongInstrument.SongInstrumentMatcher', SongInstrumentMatcher)
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('SongInstrument.Upload.SongInstrumentUploadRepository'))
    .addArgument(new Reference('SongInstrument.Video.SongInstrumentVideoRepository'))
    .addArgument(new Reference('Shared.StorageRepository'));

  container
    .register(
      'SongInstrument.SongInstrument.MatchByCriteriaSongInstrumentQueryHandler',
      MatchByCriteriaSongInstrumentQueryHandler
    )
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentMatcher'))
    .addTag('queryHandler');
}
