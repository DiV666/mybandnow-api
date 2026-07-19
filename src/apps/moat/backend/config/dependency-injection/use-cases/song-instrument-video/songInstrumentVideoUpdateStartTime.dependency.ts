import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentVideoUpdateStartTime } from '@Contexts/Moat/SongInstrumentVideo/application/updateStartTime/SongInstrumentVideoUpdateStartTime.js';
import { SongInstrumentVideoUpdateStartTimeCommandHandler } from '@Contexts/Moat/SongInstrumentVideo/application/updateStartTime/SongInstrumentVideoUpdateStartTimeCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Moat.SongInstrumentVideo.SongInstrumentVideoUpdateStartTime', SongInstrumentVideoUpdateStartTime)
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('Moat.SongInstrumentVideo.SongInstrumentVideoRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register(
      'Moat.SongInstrumentVideo.SongInstrumentVideoUpdateStartTimeCommandHandler',
      SongInstrumentVideoUpdateStartTimeCommandHandler
    )
    .addArgument(new Reference('Moat.SongInstrumentVideo.SongInstrumentVideoUpdateStartTime'))
    .addTag('commandHandler');
}
