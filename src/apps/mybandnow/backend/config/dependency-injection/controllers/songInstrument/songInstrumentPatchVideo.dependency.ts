import { ContainerBuilder, Reference } from 'node-dependency-injection';
import SongInstrumentPatchVideoController from '../../../../controllers/songInstrument/SongInstrumentPatchVideoController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register(
      'Apps.Mybandnow.Backend.controllers.SongInstrumentPatchVideoController',
      SongInstrumentPatchVideoController
    )
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
