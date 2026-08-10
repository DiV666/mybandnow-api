import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentVideoCreator } from '@Contexts/SongInstrument/Video/application/create/SongInstrumentVideoCreator.js';
import { CreateSongInstrumentVideoCommandHandler } from '@Contexts/SongInstrument/Video/application/create/CreateSongInstrumentVideoCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.Video.SongInstrumentVideoCreator', SongInstrumentVideoCreator)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('SongInstrument.Video.SongInstrumentVideoRepository'))
    .addArgument(new Reference('Shared.EventBus'))
    .addArgument(new Reference('Shared.Clock'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'));

  container
    .register('SongInstrument.Video.CreateSongInstrumentVideoCommandHandler', CreateSongInstrumentVideoCommandHandler)
    .addArgument(new Reference('SongInstrument.Video.SongInstrumentVideoCreator'))
    .addTag('commandHandler');
}
