import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandFinder } from '@Contexts/Band/application/search/BandFinder.js';
import { SearchBandQueryHandler } from '@Contexts/Band/application/search/SearchBandQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Band.BandFinder', BandFinder)
    .addArgument(new Reference('Shared.CriteriaScopeSecurity'))
    .addArgument(new Reference('Band.BandRepository'));

  container
    .register('Band.SearchBandQueryHandler', SearchBandQueryHandler)
    .addArgument(new Reference('Band.BandFinder'))
    .addTag('queryHandler');
}
