import { ContainerBuilder, Reference } from 'node-dependency-injection';
import SongInstrumentUploadPostUploadCancelController from '../../../../controllers/songInstrumentUpload/SongInstrumentUploadPostUploadCancelController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register(
      'Apps.Mybandnow.Backend.controllers.SongInstrumentUploadPostUploadCancelController',
      SongInstrumentUploadPostUploadCancelController
    )
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
