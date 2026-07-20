import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentAssigner } from '@Contexts/Moat/SongInstrument/application/assign/SongInstrumentAssigner.js';
import { AssignSongInstrumentMusicianCommandHandler } from '@Contexts/Moat/SongInstrument/application/assign/AssignSongInstrumentMusicianCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.SongInstrument.SongInstrumentAssigner', SongInstrumentAssigner)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Moat.Song.SongRepository'));

  container
    .register(
      'Moat.SongInstrument.AssignSongInstrumentMusicianCommandHandler',
      AssignSongInstrumentMusicianCommandHandler
    )
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentAssigner'))
    .addTag('commandHandler');
}
