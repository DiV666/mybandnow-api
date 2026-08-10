import { ContainerBuilder, Reference } from 'node-dependency-injection';
import BandPostCreateController from '../../../../controllers/band/BandPostCreateController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.BandPostCreateController', BandPostCreateController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
