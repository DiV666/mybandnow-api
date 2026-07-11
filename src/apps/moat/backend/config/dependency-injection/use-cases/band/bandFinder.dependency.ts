import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandFinder } from '@Contexts/Moat/Band/application/search/BandFinder.js';
import { SearchBandQueryHandler } from '@Contexts/Moat/Band/application/search/SearchBandQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.Band.BandFinder', BandFinder)
    .addArgument(new Reference('Shared.CriteriaScopeSecurity'))
    .addArgument(new Reference('Moat.Band.BandRepository'));

  container
    .register('Moat.Band.SearchBandQueryHandler', SearchBandQueryHandler)
    .addArgument(new Reference('Moat.Band.BandFinder'))
    .addTag('queryHandler');
}
