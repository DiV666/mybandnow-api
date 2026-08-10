import { ContainerBuilder } from 'node-dependency-injection';
import { CommandBusBandMembershipGateway } from '@Contexts/SongInstrument/SongInstrument/infrastructure/CommandBusBandMembershipGateway.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.SongInstrument.BandMembershipGateway', CommandBusBandMembershipGateway)
    .addArgument(() => container.get('Shared.CommandBus'));
}
