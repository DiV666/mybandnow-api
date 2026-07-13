import { register as registerUserLogin } from '../use-cases/user/userLogin.dependency.js';
import { LocalJwtBearerToken } from '@Contexts/Mybandnow/Shared/infrastructure/Authentication/LocalJwtBearerToken.js';
import { UserPrismaRepository } from '@Contexts/Mybandnow/User/infrastructure/persistence/UserPrismaRepository.js';
import { PrismaMusicianRepository } from '@Contexts/Moat/Musician/infrastructure/persistence/PrismaMusicianRepository.js';
import { MusicianSearchByUserIdQueryHandler } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQueryHandler.js';
import { MusicianSearchByUserId } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserId.js';
import { register as registerUserRegister } from '../use-cases/user/userRegister.dependency.js';
import { register as registerMusicianCreator } from '@Apps/moat/backend/config/dependency-injection/use-cases/musician/musicianCreator.dependency.js';
import { register as registerMusicianFindById } from '@Apps/moat/backend/config/dependency-injection/use-cases/musician/musicianFindById.dependency.js';
import { register as registerBandCreator } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandCreator.dependency.js';
import { register as registerBandUpdater } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandUpdater.dependency.js';
import { register as registerBandRemover } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandRemover.dependency.js';
import { register as registerBandFinder } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandFinder.dependency.js';
import { register as registerBandMatcher } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandMatcher.dependency.js';
import { register as registerSongInstrumentCreator } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument/songInstrumentCreator.dependency.js';
import { register as registerSongInstrumentVideoCreator } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument-video/songInstrumentVideoCreator.dependency.js';
import { register as registerSongInstrumentUploadUploader } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument-upload/songInstrumentUploadUploader.dependency.js';
import { register as registerSongInstrumentUploadStatusUpdater } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument-upload/songInstrumentUploadStatusUpdater.dependency.js';
import { BandPrismaRepository } from '@Contexts/Moat/Band/infrastructure/persistence/BandPrismaRepository.js';
import { SongInstrumentPrismaRepository } from '@Contexts/Moat/SongInstrument/infrastructure/persistence/SongInstrumentPrismaRepository.js';
import { SongInstrumentVideoPrismaRepository } from '@Contexts/Moat/SongInstrumentVideo/infrastructure/persistence/SongInstrumentVideoPrismaRepository.js';
import { SongInstrumentCheckSongOwnership } from '@Contexts/Moat/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnership.js';
import { SongInstrumentCheckSongOwnershipQueryHandler } from '@Contexts/Moat/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnershipQueryHandler.js';
import { SongInstrumentUploadPrismaRepository } from '@Contexts/Moat/SongInstrumentUpload/infrastructure/persistence/SongInstrumentUploadPrismaRepository.js';
import { VideoclipPrismaRepository } from '@Contexts/Moat/Videoclip/infrastructure/persistence/VideoclipPrismaRepository.js';
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
  container.register('Moat.Band.BandRepository', BandPrismaRepository).addArgument(new Reference('Shared.Outbox'));
  container
    .register('Moat.SongInstrument.SongInstrumentRepository', SongInstrumentPrismaRepository)
    .addArgument(new Reference('Shared.Outbox'));
  container
    .register('Moat.SongInstrumentVideo.SongInstrumentVideoRepository', SongInstrumentVideoPrismaRepository)
    .addArgument(new Reference('Shared.Outbox'));
  container
    .register('Moat.SongInstrumentUpload.SongInstrumentUploadRepository', SongInstrumentUploadPrismaRepository)
    .addArgument(new Reference('Shared.Outbox'));

  container.register('Moat.Videoclip.VideoclipRepository', VideoclipPrismaRepository);

  // Use Cases
  registerUserLogin(container);
  registerUserRegister(container);
  registerMusicianCreator(container);
  registerMusicianFindById(container);
  registerBandCreator(container);
  registerBandUpdater(container);
  registerBandRemover(container);
  registerBandFinder(container);
  registerBandMatcher(container);
  registerSongInstrumentCreator(container);
  registerSongInstrumentVideoCreator(container);
  registerSongInstrumentUploadUploader(container);
  registerSongInstrumentUploadStatusUpdater(container);

  container
    .register('Moat.Musician.MusicianSearchByUserId', MusicianSearchByUserId)
    .addArgument(new Reference('Moat.Musician.MusicianRepository'));

  container
    .register('Moat.Musician.MusicianSearchByUserIdQueryHandler', MusicianSearchByUserIdQueryHandler)
    .addArgument(new Reference('Moat.Musician.MusicianSearchByUserId'))
    .addTag('queryHandler');

  container
    .register('Moat.SongInstrument.SongInstrumentCheckSongOwnership', SongInstrumentCheckSongOwnership)
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentRepository'));

  container
    .register(
      'Moat.SongInstrument.SongInstrumentCheckSongOwnershipQueryHandler',
      SongInstrumentCheckSongOwnershipQueryHandler
    )
    .addArgument(new Reference('Moat.SongInstrument.SongInstrumentCheckSongOwnership'))
    .addTag('queryHandler');
}
