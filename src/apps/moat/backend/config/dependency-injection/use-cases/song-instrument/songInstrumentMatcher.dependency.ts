import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentMatcher } from '@Contexts/Moat/SongInstrument/application/matchByCriteria/SongInstrumentMatcher.js';
import { MatchByCriteriaSongInstrumentQueryHandler } from '@Contexts/Moat/SongInstrument/application/matchByCriteria/MatchByCriteriaSongInstrumentQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.SongInstrument.SongInstrumentMatcher', SongInstrumentMatcher)
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'));

  container
    .register(
      'Moat.SongInstrument.MatchByCriteriaSongInstrumentQueryHandler',
      MatchByCriteriaSongInstrumentQueryHandler
    )
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentMatcher'))
    .addTag('queryHandler');
}
