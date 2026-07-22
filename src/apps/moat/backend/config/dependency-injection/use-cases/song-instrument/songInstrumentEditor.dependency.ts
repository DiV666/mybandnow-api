import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentEditor } from '@Contexts/Moat/SongInstrument/application/edit/SongInstrumentEditor.js';
import { EditSongInstrumentCommandHandler } from '@Contexts/Moat/SongInstrument/application/edit/EditSongInstrumentCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.SongInstrument.SongInstrumentEditor', SongInstrumentEditor)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'));

  container
    .register('Moat.SongInstrument.EditSongInstrumentCommandHandler', EditSongInstrumentCommandHandler)
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentEditor'))
    .addTag('commandHandler');
}
