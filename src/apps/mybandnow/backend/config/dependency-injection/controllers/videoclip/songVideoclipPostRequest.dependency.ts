import { ContainerBuilder, Reference } from 'node-dependency-injection';
import SongVideoclipPostRequestController from '../../../../controllers/videoclip/SongVideoclipPostRequestController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register(
      'Apps.Mybandnow.Backend.controllers.SongVideoclipPostRequestController',
      SongVideoclipPostRequestController
    )
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
