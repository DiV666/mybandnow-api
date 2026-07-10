import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandRemover } from '@Contexts/Moat/Band/application/remove/BandRemover.js';
import { RemoveBandCommandHandler } from '@Contexts/Moat/Band/application/remove/RemoveBandCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.Band.BandRemover', BandRemover)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CriteriaScopeSecurity'))
    .addArgument(new Reference('Moat.Band.BandPrismaRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Moat.Band.RemoveBandCommandHandler', RemoveBandCommandHandler)
    .addArgument(new Reference('Moat.Band.BandRemover'))
    .addTag('commandHandler');
}
