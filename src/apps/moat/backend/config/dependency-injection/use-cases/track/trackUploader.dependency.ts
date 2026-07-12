import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { TrackUploader } from '@Contexts/Moat/Track/application/upload/TrackUploader.js';
import { TrackUploadCommandHandler } from '@Contexts/Moat/Track/application/upload/TrackUploadCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.Track.TrackUploader', TrackUploader)
    .addArgument(new Reference('Moat.Track.TrackRepository'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Shared.EventBus'))
    .addArgument(new Reference('Shared.Clock'));

  container
    .register('Moat.Track.TrackUploadCommandHandler', TrackUploadCommandHandler)
    .addArgument(new Reference('Moat.Track.TrackUploader'))
    .addTag('commandHandler');
}
