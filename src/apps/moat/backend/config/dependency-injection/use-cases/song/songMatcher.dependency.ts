import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongMatcher } from '@Contexts/Song/application/matchByCriteria/SongMatcher.js';
import { MatchByCriteriaSongQueryHandler } from '@Contexts/Song/application/matchByCriteria/MatchByCriteriaSongQueryHandler.js';

export function register(container: ContainerBuilder) {
  container.register('Song.SongMatcher', SongMatcher).addArgument(new Reference('Song.SongRepository'));

  container
    .register('Song.MatchByCriteriaSongQueryHandler', MatchByCriteriaSongQueryHandler)
    .addArgument(new Reference('Song.SongMatcher'))
    .addTag('queryHandler');
}
