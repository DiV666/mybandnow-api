import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandRemover } from '@Contexts/Band/application/remove/BandRemover.js';
import { RemoveBandCommandHandler } from '@Contexts/Band/application/remove/RemoveBandCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Band.BandRemover', BandRemover)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CriteriaScopeSecurity'))
    .addArgument(new Reference('Band.BandRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Band.RemoveBandCommandHandler', RemoveBandCommandHandler)
    .addArgument(new Reference('Band.BandRemover'))
    .addTag('commandHandler');
}
