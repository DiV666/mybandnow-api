import { ContainerBuilder, Reference } from 'node-dependency-injection';
import InstrumentsGetMatchByCriteriaController from '../../../../controllers/instruments/InstrumentsGetMatchByCriteriaController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register(
      'Apps.Mybandnow.Backend.controllers.InstrumentsGetMatchByCriteriaController',
      InstrumentsGetMatchByCriteriaController
    )
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(null)
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
