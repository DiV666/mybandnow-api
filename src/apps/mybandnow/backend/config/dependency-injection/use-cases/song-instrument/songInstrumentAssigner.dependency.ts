import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentAssigner } from '@Contexts/SongInstrument/SongInstrument/application/assign/SongInstrumentAssigner.js';
import { AssignSongInstrumentMusicianCommandHandler } from '@Contexts/SongInstrument/SongInstrument/application/assign/AssignSongInstrumentMusicianCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.SongInstrument.SongInstrumentAssigner', SongInstrumentAssigner)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('SongInstrument.SongInstrument.BandMembershipGateway'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'));

  container
    .register(
      'SongInstrument.SongInstrument.AssignSongInstrumentMusicianCommandHandler',
      AssignSongInstrumentMusicianCommandHandler
    )
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentAssigner'))
    .addTag('commandHandler');
}
