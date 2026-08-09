import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { UserLogin } from '@Contexts/Identity/User/application/login/UserLogin.js';
import { LoginUserQueryHandler } from '@Contexts/Identity/User/application/login/LoginUserQueryHandler.js';

export function register(container: ContainerBuilder) {
  container
    .register('Identity.User.UserLogin', UserLogin)
    .addArgument(new Reference('Identity.User.UserRepository'))
    .addArgument(new Reference('Identity.User.JwtGenerator'))
    .addArgument(new Reference('Identity.User.PasswordEncryptor'));

  container
    .register('Identity.User.LoginUserQueryHandler', LoginUserQueryHandler)
    .addArgument(new Reference('Identity.User.UserLogin'))
    .addTag('queryHandler');
}
