import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { SongInstrumentVideoUpdateStartTime } from '@Contexts/SongInstrument/Video/application/updateStartTime/SongInstrumentVideoUpdateStartTime.js';
import { SongInstrumentVideoUpdateStartTimeCommandHandler } from '@Contexts/SongInstrument/Video/application/updateStartTime/SongInstrumentVideoUpdateStartTimeCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('SongInstrument.Video.SongInstrumentVideoUpdateStartTime', SongInstrumentVideoUpdateStartTime)
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'))
    .addArgument(new Reference('SongInstrument.Video.SongInstrumentVideoRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register(
      'SongInstrument.Video.SongInstrumentVideoUpdateStartTimeCommandHandler',
      SongInstrumentVideoUpdateStartTimeCommandHandler
    )
    .addArgument(new Reference('SongInstrument.Video.SongInstrumentVideoUpdateStartTime'))
    .addTag('commandHandler');
}
