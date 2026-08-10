import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { InstrumentsMatcher } from '@Contexts/Instruments/application/matchByCriteria/InstrumentsMatcher.js';
import { MatchByCriteriaInstrumentsQueryHandler } from '@Contexts/Instruments/application/matchByCriteria/MatchByCriteriaInstrumentsQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Instruments.InstrumentsMatcher', InstrumentsMatcher)
    .addArgument(new Reference('Instruments.InstrumentsRepository'));

  container
    .register('Instruments.MatchByCriteriaInstrumentsQueryHandler', MatchByCriteriaInstrumentsQueryHandler)
    .addArgument(new Reference('Instruments.InstrumentsMatcher'))
    .addTag('queryHandler');
}
