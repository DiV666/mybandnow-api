import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandCreator } from '@Contexts/Band/application/create/BandCreator.js';
import { CreateBandCommandHandler } from '@Contexts/Band/application/create/CreateBandCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Band.BandCreator', BandCreator)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Band.BandRepository'))
    .addArgument(new Reference('Shared.EventBus'))
    .addArgument(new Reference('Shared.Clock'));

  container
    .register('Band.CreateBandCommandHandler', CreateBandCommandHandler)
    .addArgument(new Reference('Band.BandCreator'))
    .addTag('commandHandler');
}
