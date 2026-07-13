import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentVideoCreator } from '@Contexts/Moat/SongInstrumentVideo/application/create/SongInstrumentVideoCreator.js';
import { CreateSongInstrumentVideoCommandHandler } from '@Contexts/Moat/SongInstrumentVideo/application/create/CreateSongInstrumentVideoCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.SongInstrumentVideo.SongInstrumentVideoCreator', SongInstrumentVideoCreator)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Moat.SongInstrumentVideo.SongInstrumentVideoRepository'))
    .addArgument(new Reference('Shared.EventBus'))
    .addArgument(new Reference('Shared.Clock'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'));

  container
    .register(
      'Moat.SongInstrumentVideo.CreateSongInstrumentVideoCommandHandler',
      CreateSongInstrumentVideoCommandHandler
    )
    .addArgument(new Reference('Moat.SongInstrumentVideo.SongInstrumentVideoCreator'))
    .addTag('commandHandler');
}
