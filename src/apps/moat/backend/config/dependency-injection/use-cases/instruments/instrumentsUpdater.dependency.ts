import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { InstrumentsUpdater } from '@Contexts/Moat/Instruments/application/update/InstrumentsUpdater.js';
import { UpdateInstrumentsCommandHandler } from '@Contexts/Moat/Instruments/application/update/UpdateInstrumentsCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.Instruments.InstrumentsUpdater', InstrumentsUpdater)
    .addArgument(new Reference('Moat.Instruments.InstrumentsRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Moat.Instruments.UpdateInstrumentsCommandHandler', UpdateInstrumentsCommandHandler)
    .addArgument(new Reference('Moat.Instruments.InstrumentsUpdater'))
    .addTag('commandHandler');
}
