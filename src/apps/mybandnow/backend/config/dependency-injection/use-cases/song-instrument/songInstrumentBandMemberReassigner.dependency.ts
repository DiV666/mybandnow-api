import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentBandMemberReassigner } from '@Contexts/SongInstrument/SongInstrument/application/reassignBandMember/SongInstrumentBandMemberReassigner.js';
import { ReassignBandMemberSongInstrumentsCommandHandler } from '@Contexts/SongInstrument/SongInstrument/application/reassignBandMember/ReassignBandMemberSongInstrumentsCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.SongInstrument.SongInstrumentBandMemberReassigner', SongInstrumentBandMemberReassigner)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'));

  container
    .register(
      'SongInstrument.SongInstrument.ReassignBandMemberSongInstrumentsCommandHandler',
      ReassignBandMemberSongInstrumentsCommandHandler
    )
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentBandMemberReassigner'))
    .addTag('commandHandler');
}
