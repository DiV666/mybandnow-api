import { register as registerUserLogin } from '../use-cases/user/userLogin.dependency.js';
import { LocalJwtBearerToken } from '@Contexts/Mybandnow/Shared/infrastructure/Authentication/LocalJwtBearerToken.js';
import { UserPrismaRepository } from '@Contexts/Mybandnow/User/infrastructure/persistence/UserPrismaRepository.js';
import { PrismaMusicianRepository } from '@Contexts/Moat/Musician/infrastructure/persistence/PrismaMusicianRepository.js';
import { MusicianSearchByEmail } from '@Contexts/Moat/Musician/application/searchByEmail/MusicianSearchByEmail.js';
import { MusicianSearchByEmailQueryHandler } from '@Contexts/Moat/Musician/application/searchByEmail/MusicianSearchByEmailQueryHandler.js';
import { MusicianSearchByUserIdQueryHandler } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserIdQueryHandler.js';
import { MusicianSearchByUserId } from '@Contexts/Moat/Musician/application/searchByUserId/MusicianSearchByUserId.js';
import { register as registerUserRegister } from '../use-cases/user/userRegister.dependency.js';
import { register as registerMusicianCreator } from '@Apps/moat/backend/config/dependency-injection/use-cases/musician/musicianCreator.dependency.js';
import { register as registerMusicianFindById } from '@Apps/moat/backend/config/dependency-injection/use-cases/musician/musicianFindById.dependency.js';
import { register as registerBandCreator } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandCreator.dependency.js';
import { register as registerBandMemberAdder } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandMemberAdder.dependency.js';
import { register as registerBandUpdater } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandUpdater.dependency.js';
import { register as registerBandRemover } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandRemover.dependency.js';
import { register as registerBandFinder } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandFinder.dependency.js';
import { register as registerBandMatcher } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandMatcher.dependency.js';
import { register as registerSongInstrumentAssigner } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument/songInstrumentAssigner.dependency.js';
import { register as registerSongInstrumentCreator } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument/songInstrumentCreator.dependency.js';
import { register as registerSongInstrumentFindById } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument/songInstrumentFindById.dependency.js';
import { register as registerSongInstrumentMatcher } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument/songInstrumentMatcher.dependency.js';
import { register as registerSongInstrumentVideoCreator } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument-video/songInstrumentVideoCreator.dependency.js';
import { register as registerSongInstrumentVideoUpdateStartTime } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument-video/songInstrumentVideoUpdateStartTime.dependency.js';
import { register as registerSongInstrumentUploadUploader } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument-upload/songInstrumentUploadUploader.dependency.js';
import { register as registerSongInstrumentUploadStatusUpdater } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument-upload/songInstrumentUploadStatusUpdater.dependency.js';
import { register as registerInstrumentsFinder } from '@Apps/moat/backend/config/dependency-injection/use-cases/instruments/instrumentsFinder.dependency.js';
import { register as registerInstrumentsMatcher } from '@Apps/moat/backend/config/dependency-injection/use-cases/instruments/instrumentsMatcher.dependency.js';
import { BandPrismaRepository } from '@Contexts/Moat/Band/infrastructure/persistence/BandPrismaRepository.js';
import { SongPrismaRepository } from '@Contexts/Moat/Song/infrastructure/persistence/SongPrismaRepository.js';
import { SongCheckBandMembership } from '@Contexts/Moat/Song/application/checkBandMembership/SongCheckBandMembership.js';
import { SongCheckBandMembershipQueryHandler } from '@Contexts/Moat/Song/application/checkBandMembership/SongCheckBandMembershipQueryHandler.js';
import { SongCreator } from '@Contexts/Moat/Song/application/create/SongCreator.js';
import { CreateSongCommandHandler } from '@Contexts/Moat/Song/application/create/CreateSongCommandHandler.js';
import { SongListByBand } from '@Contexts/Moat/Song/application/listByBand/SongListByBand.js';
import { SongListByBandQueryHandler } from '@Contexts/Moat/Song/application/listByBand/SongListByBandQueryHandler.js';
import { register as registerSongMatcher } from '@Apps/moat/backend/config/dependency-injection/use-cases/song/songMatcher.dependency.js';
import { SongInstrumentPrismaRepository } from '@Contexts/Moat/SongInstrument/infrastructure/persistence/SongInstrumentPrismaRepository.js';
import { SongInstrumentVideoPrismaRepository } from '@Contexts/Moat/SongInstrumentVideo/infrastructure/persistence/SongInstrumentVideoPrismaRepository.js';
import { SongInstrumentCheckSongOwnership } from '@Contexts/Moat/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnership.js';
import { SongInstrumentCheckSongOwnershipQueryHandler } from '@Contexts/Moat/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnershipQueryHandler.js';
import { SongInstrumentUploadPrismaRepository } from '@Contexts/Moat/SongInstrumentUpload/infrastructure/persistence/SongInstrumentUploadPrismaRepository.js';
import { VideoclipPrismaRepository } from '@Contexts/Moat/Videoclip/infrastructure/persistence/VideoclipPrismaRepository.js';
import { InstrumentsPrismaRepository } from '@Contexts/Moat/Instruments/infrastructure/persistence/InstrumentsPrismaRepository.js';
import { ContainerBuilder, Reference } from 'node-dependency-injection';

import { InternalAuthentication } from '@Contexts/Mybandnow/Shared/infrastructure/identityServer/internal/InternalAuthentication.js';
import { LocalJwtGenerator } from '@Contexts/Mybandnow/User/infrastructure/service/LocalJwtGenerator.js';
import { BcryptPasswordEncryptor } from '@Contexts/Mybandnow/User/infrastructure/auth/BcryptPasswordEncryptor.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';

export function registerMybandnowDependencies(container: ContainerBuilder) {
  // Authentication
  container
    .register('Mybandnow.Shared.LocalJwtBearerToken', LocalJwtBearerToken)
    .addArgument(new Reference('Mybandnow.User.UserRepository'));

  container
    .register('Mybandnow.Shared.InternalAuthentication', InternalAuthentication)
    .addArgument(Buffer.from(env.KLODING_INTERNAL_PUBLIC_KEY_BASE64, 'base64').toString('utf8'));

  container.register('Mybandnow.User.JwtGenerator', LocalJwtGenerator);
  container.register('Mybandnow.User.PasswordEncryptor', BcryptPasswordEncryptor);

  // Repositories
  container.register('Mybandnow.User.UserRepository', UserPrismaRepository).addArgument(new Reference('Shared.Outbox'));
  container.register('Moat.Musician.MusicianRepository', PrismaMusicianRepository);
  container.register('Moat.Band.BandRepository', BandPrismaRepository).addArgument(new Reference('Shared.Outbox'));
  container.register('Moat.Song.SongRepository', SongPrismaRepository).addArgument(new Reference('Shared.Outbox'));
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
  container
    .register('Moat.Instruments.InstrumentsRepository', InstrumentsPrismaRepository)
    .addArgument(new Reference('Shared.Outbox'));

  // Use Cases
  registerUserLogin(container);
  registerUserRegister(container);
  registerMusicianCreator(container);
  registerMusicianFindById(container);
  registerBandCreator(container);
  registerBandMemberAdder(container);
  registerBandUpdater(container);
  registerBandRemover(container);
  registerBandFinder(container);
  registerBandMatcher(container);
  container
    .register('Moat.Song.SongCreator', SongCreator)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Moat.Song.SongRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Moat.Song.CreateSongCommandHandler', CreateSongCommandHandler)
    .addArgument(new Reference('Moat.Song.SongCreator'))
    .addTag('commandHandler');

  registerSongInstrumentAssigner(container);
  registerSongInstrumentCreator(container);
  registerSongInstrumentFindById(container);
  registerSongInstrumentMatcher(container);
  registerSongInstrumentVideoCreator(container);
  registerSongInstrumentVideoUpdateStartTime(container);
  registerSongInstrumentUploadUploader(container);
  registerSongInstrumentUploadStatusUpdater(container);
  registerInstrumentsFinder(container);
  registerInstrumentsMatcher(container);

  container
    .register('Moat.Musician.MusicianSearchByUserId', MusicianSearchByUserId)
    .addArgument(new Reference('Moat.Musician.MusicianRepository'));

  container
    .register('Moat.Musician.MusicianSearchByEmail', MusicianSearchByEmail)
    .addArgument(new Reference('Moat.Musician.MusicianRepository'));

  container
    .register('Moat.Musician.MusicianSearchByUserIdQueryHandler', MusicianSearchByUserIdQueryHandler)
    .addArgument(new Reference('Moat.Musician.MusicianSearchByUserId'))
    .addTag('queryHandler');

  container
    .register('Moat.Musician.MusicianSearchByEmailQueryHandler', MusicianSearchByEmailQueryHandler)
    .addArgument(new Reference('Moat.Musician.MusicianSearchByEmail'))
    .addTag('queryHandler');

  container
    .register('Moat.Song.SongCheckBandMembership', SongCheckBandMembership)
    .addArgument(new Reference('Moat.Song.SongRepository'));

  container
    .register('Moat.Song.SongCheckBandMembershipQueryHandler', SongCheckBandMembershipQueryHandler)
    .addArgument(new Reference('Moat.Song.SongCheckBandMembership'))
    .addTag('queryHandler');

  container
    .register('Moat.Song.SongListByBand', SongListByBand)
    .addArgument(new Reference('Moat.Song.SongRepository'))
    .addArgument(new Reference('Moat.Song.SongRepository'));

  container
    .register('Moat.Song.SongListByBandQueryHandler', SongListByBandQueryHandler)
    .addArgument(new Reference('Moat.Song.SongListByBand'))
    .addTag('queryHandler');

  registerSongMatcher(container);

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
