import { ContainerBuilder, Reference } from 'node-dependency-injection';
import UserPostRegisterController from '../../../../controllers/user/UserPostRegisterController.js';

export const register = (container: ContainerBuilder) => {
  container
    .register('Apps.Mybandnow.Backend.controllers.UserPostRegisterController', UserPostRegisterController)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CommandBus'))
    .addArgument(null)
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));
};
