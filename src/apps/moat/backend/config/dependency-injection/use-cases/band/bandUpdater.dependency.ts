import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandUpdater } from '@Contexts/Band/application/update/BandUpdater.js';
import { UpdateBandCommandHandler } from '@Contexts/Band/application/update/UpdateBandCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Band.BandUpdater', BandUpdater)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CriteriaScopeSecurity'))
    .addArgument(new Reference('Band.BandRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Band.UpdateBandCommandHandler', UpdateBandCommandHandler)
    .addArgument(new Reference('Band.BandUpdater'))
    .addTag('commandHandler');
}
