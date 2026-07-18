import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { InstrumentsFinder } from '@Contexts/Moat/Instruments/application/search/InstrumentsFinder.js';
import { SearchInstrumentsQueryHandler } from '@Contexts/Moat/Instruments/application/search/SearchInstrumentsQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.Instruments.InstrumentsFinder', InstrumentsFinder)
    .addArgument(new Reference('Moat.Instruments.InstrumentsRepository'));

  container
    .register('Moat.Instruments.SearchInstrumentsQueryHandler', SearchInstrumentsQueryHandler)
    .addArgument(new Reference('Moat.Instruments.InstrumentsFinder'))
    .addTag('queryHandler');
}
