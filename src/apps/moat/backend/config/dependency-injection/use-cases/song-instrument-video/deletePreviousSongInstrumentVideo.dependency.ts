import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { DeletePreviousSongInstrumentVideo } from '@Contexts/Moat/SongInstrumentVideo/application/deletePrevious/DeletePreviousSongInstrumentVideo.js';
import { DeletePreviousSongInstrumentVideoCommandHandler } from '@Contexts/Moat/SongInstrumentVideo/application/deletePrevious/DeletePreviousSongInstrumentVideoCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.SongInstrumentVideo.DeletePreviousSongInstrumentVideo', DeletePreviousSongInstrumentVideo)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.StorageRepository'));

  container
    .register(
      'Moat.SongInstrumentVideo.DeletePreviousSongInstrumentVideoCommandHandler',
      DeletePreviousSongInstrumentVideoCommandHandler
    )
    .addArgument(new Reference('Moat.SongInstrumentVideo.DeletePreviousSongInstrumentVideo'))
    .addTag('commandHandler');
}
