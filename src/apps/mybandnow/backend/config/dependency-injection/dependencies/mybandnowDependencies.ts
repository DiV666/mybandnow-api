import { register as registerUserLogin } from '../use-cases/user/userLogin.dependency.js';
import { LocalJwtBearerToken } from '@Contexts/Mybandnow/Shared/infrastructure/Authentication/LocalJwtBearerToken.js';
import { UserPrismaRepository } from '@Contexts/Mybandnow/User/infrastructure/persistence/UserPrismaRepository.js';
import { PrismaMusicianRepository } from '@Contexts/Moat/Musician/infrastructure/persistence/PrismaMusicianRepository.js';
import { MusicianSearchByUserIdQueryHandler } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQueryHandler.js';
import { MusicianSearchByUserId } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserId.js';
import { register as registerUserRegister } from '../use-cases/user/userRegister.dependency.js';
import { ContainerBuilder, Reference } from 'node-dependency-injection';

import { InternalAuthentication } from '@Contexts/Mybandnow/Shared/infrastructure/identityServer/internal/InternalAuthentication.js';
import { LocalJwtGenerator } from '@Contexts/Mybandnow/User/infrastructure/service/LocalJwtGenerator.js';
import { BcryptPasswordEncryptor } from '@Contexts/Mybandnow/User/infrastructure/auth/BcryptPasswordEncryptor.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';

export function registerMybandnowDependencies(container: ContainerBuilder) {
  // Authentication
  container.register('Mybandnow.Shared.LocalJwtBearerToken', LocalJwtBearerToken);

  container
    .register('Mybandnow.Shared.InternalAuthentication', InternalAuthentication)
    .addArgument(Buffer.from(env.KLODING_INTERNAL_PUBLIC_KEY_BASE64, 'base64').toString('utf8'));

  container.register('Mybandnow.User.JwtGenerator', LocalJwtGenerator);
  container.register('Mybandnow.User.PasswordEncryptor', BcryptPasswordEncryptor);

  // Repositories
  container.register('Mybandnow.User.UserRepository', UserPrismaRepository).addArgument(new Reference('Shared.Outbox'));
  container.register('Moat.Musician.MusicianRepository', PrismaMusicianRepository);

  // Use Cases
  registerUserLogin(container);
  registerUserRegister(container);

  container
    .register('Moat.Musician.MusicianSearchByUserId', MusicianSearchByUserId)
    .addArgument(new Reference('Moat.Musician.MusicianRepository'));

  container
    .register('Moat.Musician.MusicianSearchByUserIdQueryHandler', MusicianSearchByUserIdQueryHandler)
    .addArgument(new Reference('Moat.Musician.MusicianSearchByUserId'))
    .addTag('queryHandler');
}
