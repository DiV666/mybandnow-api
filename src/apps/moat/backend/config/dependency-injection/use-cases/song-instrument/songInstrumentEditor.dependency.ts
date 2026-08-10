import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentEditor } from '@Contexts/SongInstrument/SongInstrument/application/edit/SongInstrumentEditor.js';
import { EditSongInstrumentCommandHandler } from '@Contexts/SongInstrument/SongInstrument/application/edit/EditSongInstrumentCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.SongInstrument.SongInstrumentEditor', SongInstrumentEditor)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'));

  container
    .register('SongInstrument.SongInstrument.EditSongInstrumentCommandHandler', EditSongInstrumentCommandHandler)
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentEditor'))
    .addTag('commandHandler');
}
