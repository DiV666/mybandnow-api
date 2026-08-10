import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandMatcher } from '@Contexts/Band/application/matchByCriteria/BandMatcher.js';
import { MatchByCriteriaBandQueryHandler } from '@Contexts/Band/application/matchByCriteria/MatchByCriteriaBandQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Band.BandMatcher', BandMatcher)
    .addArgument(new Reference('Shared.CriteriaScopeSecurity'))
    .addArgument(new Reference('Band.BandRepository'));

  container
    .register('Band.MatchByCriteriaBandQueryHandler', MatchByCriteriaBandQueryHandler)
    .addArgument(new Reference('Band.BandMatcher'))
    .addTag('queryHandler');
}
