import { ContainerBuilder, Reference } from 'node-dependency-injection';
import BandGetMatchByCriteriaController from '../../../../controllers/band/BandGetMatchByCriteriaController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.BandGetMatchByCriteriaController', BandGetMatchByCriteriaController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(null)
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
