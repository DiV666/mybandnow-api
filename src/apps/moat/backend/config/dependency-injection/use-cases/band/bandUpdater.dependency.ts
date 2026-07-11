import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandUpdater } from '@Contexts/Moat/Band/application/update/BandUpdater.js';
import { UpdateBandCommandHandler } from '@Contexts/Moat/Band/application/update/UpdateBandCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.Band.BandUpdater', BandUpdater)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CriteriaScopeSecurity'))
    .addArgument(new Reference('Moat.Band.BandRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Moat.Band.UpdateBandCommandHandler', UpdateBandCommandHandler)
    .addArgument(new Reference('Moat.Band.BandUpdater'))
    .addTag('commandHandler');
}
