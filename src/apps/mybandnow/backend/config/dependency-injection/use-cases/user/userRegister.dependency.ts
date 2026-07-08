import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { UserRegister } from '@Contexts/Mybandnow/User/application/register/UserRegister.js';
import { RegisterUserCommandHandler } from '@Contexts/Mybandnow/User/application/register/RegisterUserCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Mybandnow.User.UserRegister', UserRegister)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.CriteriaScopeSecurity'))
    .addArgument(new Reference('Mybandnow.User.UserPrismaRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Mybandnow.User.RegisterUserCommandHandler', RegisterUserCommandHandler)
    .addArgument(new Reference('Mybandnow.User.UserRegister'))
    .addTag('commandHandler');
}
