import { ContainerBuilder, Reference } from 'node-dependency-injection';
import BandMemberDeleteRemoveController from '../../../../controllers/band/BandMemberDeleteRemoveController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.BandMemberDeleteRemoveController', BandMemberDeleteRemoveController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
