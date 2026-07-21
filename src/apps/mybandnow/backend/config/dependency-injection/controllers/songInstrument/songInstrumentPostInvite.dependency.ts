import { ContainerBuilder, Reference } from 'node-dependency-injection';
import SongInstrumentPostInviteController from '../../../../controllers/songInstrument/SongInstrumentPostInviteController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register(
      'Apps.Mybandnow.Backend.controllers.SongInstrumentPostInviteController',
      SongInstrumentPostInviteController
    )
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
