import { ContainerBuilder, Reference } from 'node-dependency-injection';
import BandMemberGetByBandController from '../../../../controllers/band/BandMemberGetByBandController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.BandMemberGetByBandController', BandMemberGetByBandController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
