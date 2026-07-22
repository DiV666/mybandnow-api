import { ContainerBuilder, Reference } from 'node-dependency-injection';
import SongInstrumentPatchEditController from '../../../../controllers/songInstrument/SongInstrumentPatchEditController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.SongInstrumentPatchEditController', SongInstrumentPatchEditController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
