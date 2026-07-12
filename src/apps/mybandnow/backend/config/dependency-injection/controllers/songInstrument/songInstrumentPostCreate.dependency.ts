import { ContainerBuilder, Reference } from 'node-dependency-injection';
import SongInstrumentPostCreateController from '../../../../controllers/songInstrument/SongInstrumentPostCreateController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register(
      'Apps.Mybandnow.Backend.controllers.SongInstrumentPostCreateController',
      SongInstrumentPostCreateController
    )
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
