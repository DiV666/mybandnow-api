import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { InstrumentsUpdater } from '@Contexts/Instruments/application/update/InstrumentsUpdater.js';
import { UpdateInstrumentsCommandHandler } from '@Contexts/Instruments/application/update/UpdateInstrumentsCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Instruments.InstrumentsUpdater', InstrumentsUpdater)
    .addArgument(new Reference('Instruments.InstrumentsRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Instruments.UpdateInstrumentsCommandHandler', UpdateInstrumentsCommandHandler)
    .addArgument(new Reference('Instruments.InstrumentsUpdater'))
    .addTag('commandHandler');
}
