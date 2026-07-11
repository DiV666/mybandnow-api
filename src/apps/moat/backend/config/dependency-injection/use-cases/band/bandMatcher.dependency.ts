import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandMatcher } from '@Contexts/Moat/Band/application/matchByCriteria/BandMatcher.js';
import { MatchByCriteriaBandQueryHandler } from '@Contexts/Moat/Band/application/matchByCriteria/MatchByCriteriaBandQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.Band.BandMatcher', BandMatcher)
    .addArgument(new Reference('Shared.CriteriaScopeSecurity'))
    .addArgument(new Reference('Moat.Band.BandRepository'));

  container
    .register('Moat.Band.MatchByCriteriaBandQueryHandler', MatchByCriteriaBandQueryHandler)
    .addArgument(new Reference('Moat.Band.BandMatcher'))
    .addTag('queryHandler');
}
