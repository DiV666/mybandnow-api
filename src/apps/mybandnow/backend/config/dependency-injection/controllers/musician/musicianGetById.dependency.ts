import { ContainerBuilder, Reference } from 'node-dependency-injection';
import MusicianGetByIdController from '../../../../controllers/musician/MusicianGetByIdController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.MusicianGetByIdController', MusicianGetByIdController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
