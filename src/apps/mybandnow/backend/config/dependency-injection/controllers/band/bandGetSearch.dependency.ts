import { ContainerBuilder, Reference } from 'node-dependency-injection';
import BandGetSearchController from '../../../../controllers/band/BandGetSearchController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.BandGetSearchController', BandGetSearchController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(null)
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
