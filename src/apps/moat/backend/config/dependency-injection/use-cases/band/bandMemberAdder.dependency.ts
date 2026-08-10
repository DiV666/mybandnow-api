import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandMemberAdder } from '@Contexts/Band/application/addMember/BandMemberAdder.js';
import { AddBandMemberCommandHandler } from '@Contexts/Band/application/addMember/AddBandMemberCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Band.BandMemberAdder', BandMemberAdder)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Band.BandRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Band.AddBandMemberCommandHandler', AddBandMemberCommandHandler)
    .addArgument(new Reference('Band.BandMemberAdder'))
    .addTag('commandHandler');
}
