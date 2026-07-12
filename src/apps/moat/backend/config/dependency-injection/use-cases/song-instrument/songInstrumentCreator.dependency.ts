import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentCreator } from '@Contexts/Moat/SongInstrument/application/create/SongInstrumentCreator.js';
import { CreateSongInstrumentCommandHandler } from '@Contexts/Moat/SongInstrument/application/create/CreateSongInstrumentCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.SongInstrument.SongInstrumentCreator', SongInstrumentCreator)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Shared.EventBus'))
    .addArgument(new Reference('Shared.Clock'));

  container
    .register('Moat.SongInstrument.CreateSongInstrumentCommandHandler', CreateSongInstrumentCommandHandler)
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentCreator'))
    .addTag('commandHandler');
}
