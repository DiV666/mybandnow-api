import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { InstrumentsFinder } from '@Contexts/Instruments/application/search/InstrumentsFinder.js';
import { SearchInstrumentsQueryHandler } from '@Contexts/Instruments/application/search/SearchInstrumentsQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Instruments.InstrumentsFinder', InstrumentsFinder)
    .addArgument(new Reference('Instruments.InstrumentsRepository'));

  container
    .register('Instruments.SearchInstrumentsQueryHandler', SearchInstrumentsQueryHandler)
    .addArgument(new Reference('Instruments.InstrumentsFinder'))
    .addTag('queryHandler');
}
