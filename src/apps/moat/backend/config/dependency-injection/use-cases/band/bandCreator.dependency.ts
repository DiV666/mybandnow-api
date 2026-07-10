import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandCreator } from '@Contexts/Moat/Band/application/create/BandCreator.js';
import { CreateBandCommandHandler } from '@Contexts/Moat/Band/application/create/CreateBandCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.Band.BandCreator', BandCreator)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Moat.Band.BandPrismaRepository'))
    .addArgument(new Reference('Shared.EventBus'))
    .addArgument(new Reference('Shared.Clock'))
    .addArgument(new Reference('Shared.QueryBus'));

  container
    .register('Moat.Band.CreateBandCommandHandler', CreateBandCommandHandler)
    .addArgument(new Reference('Moat.Band.BandCreator'))
    .addTag('commandHandler');
}
