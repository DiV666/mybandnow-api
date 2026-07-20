import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandMemberAdder } from '@Contexts/Moat/Band/application/addMember/BandMemberAdder.js';
import { AddBandMemberCommandHandler } from '@Contexts/Moat/Band/application/addMember/AddBandMemberCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.Band.BandMemberAdder', BandMemberAdder)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Moat.Band.BandRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Moat.Band.AddBandMemberCommandHandler', AddBandMemberCommandHandler)
    .addArgument(new Reference('Moat.Band.BandMemberAdder'))
    .addTag('commandHandler');
}
