import { ContainerBuilder, Reference } from 'node-dependency-injection';
import BandPutUpdateController from '../../../../controllers/band/BandPutUpdateController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.BandPutUpdateController', BandPutUpdateController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(null)
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
