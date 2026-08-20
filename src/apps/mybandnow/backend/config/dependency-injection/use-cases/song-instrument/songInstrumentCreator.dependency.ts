import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentCreator } from '@Contexts/SongInstrument/SongInstrument/application/create/SongInstrumentCreator.js';
import { CreateSongInstrumentCommandHandler } from '@Contexts/SongInstrument/SongInstrument/application/create/CreateSongInstrumentCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.SongInstrument.SongInstrumentCreator', SongInstrumentCreator)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Shared.EventBus'))
    .addArgument(new Reference('Shared.Clock'));

  container
    .register('SongInstrument.SongInstrument.CreateSongInstrumentCommandHandler', CreateSongInstrumentCommandHandler)
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentCreator'))
    .addTag('commandHandler');
}
