import { ContainerBuilder, Reference } from 'node-dependency-injection';
import BandDeleteRemoveController from '../../../../controllers/band/BandDeleteRemoveController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.BandDeleteRemoveController', BandDeleteRemoveController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(null)
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
