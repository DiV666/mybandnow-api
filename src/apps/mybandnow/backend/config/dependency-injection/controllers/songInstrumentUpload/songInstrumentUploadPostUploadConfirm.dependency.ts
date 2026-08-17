import { ContainerBuilder, Reference } from 'node-dependency-injection';
import SongInstrumentUploadPostUploadConfirmController from '../../../../controllers/songInstrumentUpload/SongInstrumentUploadPostUploadConfirmController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register(
      'Apps.Mybandnow.Backend.controllers.SongInstrumentUploadPostUploadConfirmController',
      SongInstrumentUploadPostUploadConfirmController
    )
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
