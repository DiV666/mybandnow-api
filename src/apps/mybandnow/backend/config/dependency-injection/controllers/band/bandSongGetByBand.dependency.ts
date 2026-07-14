import { ContainerBuilder, Reference } from 'node-dependency-injection';
import BandSongGetByBandController from '../../../../controllers/band/BandSongGetByBandController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.BandSongGetByBandController', BandSongGetByBandController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
