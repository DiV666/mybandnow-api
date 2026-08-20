import { ContainerBuilder } from 'node-dependency-injection';
import { CommandBusSongInstrumentReassignmentGateway } from '@Contexts/Band/infrastructure/CommandBusSongInstrumentReassignmentGateway.js';

export function register(container: ContainerBuilder) {
  container
    .register('Band.SongInstrumentReassignmentGateway', CommandBusSongInstrumentReassignmentGateway)
    .addArgument(() => container.get('Shared.CommandBus'));
}
