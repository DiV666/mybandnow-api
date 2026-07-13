import { ContainerBuilder, Reference } from 'node-dependency-injection';
import SongInstrumentGetByIdController from '../../../../controllers/songInstrument/SongInstrumentGetByIdController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.SongInstrumentGetByIdController', SongInstrumentGetByIdController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
