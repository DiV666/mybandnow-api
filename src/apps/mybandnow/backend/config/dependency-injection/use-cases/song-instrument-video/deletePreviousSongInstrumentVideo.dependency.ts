import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { DeletePreviousSongInstrumentVideo } from '@Contexts/SongInstrument/Video/application/deletePrevious/DeletePreviousSongInstrumentVideo.js';
import { DeletePreviousSongInstrumentVideoCommandHandler } from '@Contexts/SongInstrument/Video/application/deletePrevious/DeletePreviousSongInstrumentVideoCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.Video.DeletePreviousSongInstrumentVideo', DeletePreviousSongInstrumentVideo)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.StorageRepository'));

  container
    .register(
      'SongInstrument.Video.DeletePreviousSongInstrumentVideoCommandHandler',
      DeletePreviousSongInstrumentVideoCommandHandler
    )
    .addArgument(new Reference('SongInstrument.Video.DeletePreviousSongInstrumentVideo'))
    .addTag('commandHandler');
}
