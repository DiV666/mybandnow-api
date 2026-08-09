import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { UserRegister } from '@Contexts/Identity/User/application/register/UserRegister.js';
import { RegisterUserCommandHandler } from '@Contexts/Identity/User/application/register/RegisterUserCommandHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Identity.User.UserRegister', UserRegister)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Identity.User.UserRepository'))
    .addArgument(new Reference('Identity.User.PasswordEncryptor'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Identity.User.RegisterUserCommandHandler', RegisterUserCommandHandler)
    .addArgument(new Reference('Identity.User.UserRegister'))
    .addTag('commandHandler');
}
