import { ContainerBuilder, Reference } from 'node-dependency-injection';
import InstrumentsPutUpdateController from '../../../../controllers/instruments/InstrumentsPutUpdateController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.InstrumentsPutUpdateController', InstrumentsPutUpdateController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(null)
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
