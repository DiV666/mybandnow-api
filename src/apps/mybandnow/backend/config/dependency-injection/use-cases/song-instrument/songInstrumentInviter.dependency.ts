import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentInviter } from '@Contexts/SongInstrument/SongInstrument/application/invite/SongInstrumentInviter.js';
import { InviteSongInstrumentMusicianCommandHandler } from '@Contexts/SongInstrument/SongInstrument/application/invite/InviteSongInstrumentMusicianCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.SongInstrument.SongInstrumentInviter', SongInstrumentInviter)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('SongInstrument.SongInstrument.BandMembershipGateway'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'));

  container
    .register(
      'SongInstrument.SongInstrument.InviteSongInstrumentMusicianCommandHandler',
      InviteSongInstrumentMusicianCommandHandler
    )
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentInviter'))
    .addTag('commandHandler');
}
