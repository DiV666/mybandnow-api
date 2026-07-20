import { ContainerBuilder, Reference } from 'node-dependency-injection';
import SongInstrumentPatchAssignController from '../../../../controllers/songInstrument/SongInstrumentPatchAssignController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register(
      'Apps.Mybandnow.Backend.controllers.SongInstrumentPatchAssignController',
      SongInstrumentPatchAssignController
    )
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
