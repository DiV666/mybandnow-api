import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongMatcher } from '@Contexts/Moat/Song/application/matchByCriteria/SongMatcher.js';
import { MatchByCriteriaSongQueryHandler } from '@Contexts/Moat/Song/application/matchByCriteria/MatchByCriteriaSongQueryHandler.js';

export function register(container: ContainerBuilder) {
  container.register('Moat.Song.SongMatcher', SongMatcher).addArgument(new Reference('Moat.Song.SongRepository'));

  container
    .register('Moat.Song.MatchByCriteriaSongQueryHandler', MatchByCriteriaSongQueryHandler)
    .addArgument(new Reference('Moat.Song.SongMatcher'))
    .addTag('queryHandler');
}
