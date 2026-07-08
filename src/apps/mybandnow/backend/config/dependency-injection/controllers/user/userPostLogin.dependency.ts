import { ContainerBuilder, Reference } from 'node-dependency-injection';
import UserPostLoginController from '../../../../controllers/user/UserPostLoginController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.UserPostLoginController', UserPostLoginController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(null)
    .addArgument(new Reference('Shared.QueryBus'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
