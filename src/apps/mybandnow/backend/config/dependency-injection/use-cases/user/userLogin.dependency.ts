import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { UserLogin } from '@Contexts/Mybandnow/User/application/login/UserLogin.js';
import { LoginUserQueryHandler } from '@Contexts/Mybandnow/User/application/login/LoginUserQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Mybandnow.User.UserLogin', UserLogin)
    .addArgument(new Reference('Mybandnow.User.UserRepository'))
    .addArgument(new Reference('Mybandnow.User.JwtGenerator'))
    .addArgument(new Reference('Mybandnow.User.PasswordEncryptor'));

  container
    .register('Mybandnow.User.LoginUserQueryHandler', LoginUserQueryHandler)
    .addArgument(new Reference('Mybandnow.User.UserLogin'))
    .addTag('queryHandler');
}
