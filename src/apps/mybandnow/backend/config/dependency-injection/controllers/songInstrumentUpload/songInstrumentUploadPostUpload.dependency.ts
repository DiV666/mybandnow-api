import { ContainerBuilder, Reference } from 'node-dependency-injection';
import SongInstrumentUploadPostUploadController from '../../../../controllers/songInstrumentUpload/SongInstrumentUploadPostUploadController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register(
      'Apps.Mybandnow.Backend.controllers.SongInstrumentUploadPostUploadController',
      SongInstrumentUploadPostUploadController
    )
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'))
    .addArgument(new Reference('Shared.Express.MultipartFileParser'));
};
