import { ContainerBuilder, Reference } from 'node-dependency-injection';
import SongGetMatchByCriteriaController from '../../../../controllers/song/SongGetMatchByCriteriaController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.SongGetMatchByCriteriaController', SongGetMatchByCriteriaController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
