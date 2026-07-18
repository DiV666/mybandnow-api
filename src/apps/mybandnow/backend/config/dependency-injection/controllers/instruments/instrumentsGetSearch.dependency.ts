import { ContainerBuilder, Reference } from 'node-dependency-injection';
import InstrumentsGetSearchController from '../../../../controllers/instruments/InstrumentsGetSearchController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.InstrumentsGetSearchController', InstrumentsGetSearchController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(null)
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
