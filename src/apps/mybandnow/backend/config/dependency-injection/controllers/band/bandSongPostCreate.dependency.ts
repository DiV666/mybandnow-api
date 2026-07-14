import { ContainerBuilder, Reference } from 'node-dependency-injection';
import BandSongPostCreateController from '../../../../controllers/band/BandSongPostCreateController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.BandSongPostCreateController', BandSongPostCreateController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
