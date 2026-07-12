import { ContainerBuilder, Reference } from 'node-dependency-injection';
import TrackPostUploadController from '../../../../controllers/track/TrackPostUploadController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.TrackPostUploadController', TrackPostUploadController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'))
    .addArgument(new Reference('Shared.Express.MultipartFileParser'));
};
