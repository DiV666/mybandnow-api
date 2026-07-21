import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentInviter } from '@Contexts/Moat/SongInstrument/application/invite/SongInstrumentInviter.js';
import { InviteSongInstrumentMusicianCommandHandler } from '@Contexts/Moat/SongInstrument/application/invite/InviteSongInstrumentMusicianCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.SongInstrument.SongInstrumentInviter', SongInstrumentInviter)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get('Shared.CommandBus'))
    .addArgument(new Reference('Moat.Musician.MusicianRepository'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Moat.Song.SongRepository'));

  container
    .register(
      'Moat.SongInstrument.InviteSongInstrumentMusicianCommandHandler',
      InviteSongInstrumentMusicianCommandHandler
    )
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentInviter'))
    .addTag('commandHandler');
}
