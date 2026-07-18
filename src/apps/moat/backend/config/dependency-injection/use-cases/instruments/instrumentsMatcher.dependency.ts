import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { InstrumentsMatcher } from '@Contexts/Moat/Instruments/application/matchByCriteria/InstrumentsMatcher.js';
import { MatchByCriteriaInstrumentsQueryHandler } from '@Contexts/Moat/Instruments/application/matchByCriteria/MatchByCriteriaInstrumentsQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.Instruments.InstrumentsMatcher', InstrumentsMatcher)
    .addArgument(new Reference('Moat.Instruments.InstrumentsRepository'));

  container
    .register('Moat.Instruments.MatchByCriteriaInstrumentsQueryHandler', MatchByCriteriaInstrumentsQueryHandler)
    .addArgument(new Reference('Moat.Instruments.InstrumentsMatcher'))
    .addTag('queryHandler');
}
