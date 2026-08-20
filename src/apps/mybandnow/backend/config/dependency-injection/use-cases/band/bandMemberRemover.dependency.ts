import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { BandMemberRemover } from '@Contexts/Band/application/removeMember/BandMemberRemover.js';
import { RemoveBandMemberCommandHandler } from '@Contexts/Band/application/removeMember/RemoveBandMemberCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Band.BandMemberRemover', BandMemberRemover)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Band.BandRepository'))
    .addArgument(new Reference('Shared.EventBus'))
    .addArgument(new Reference('Band.SongInstrumentReassignmentGateway'));

  container
    .register('Band.RemoveBandMemberCommandHandler', RemoveBandMemberCommandHandler)
    .addArgument(new Reference('Band.BandMemberRemover'))
    .addTag('commandHandler');
}
