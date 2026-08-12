import { register as registerUserLogin } from '../use-cases/user/userLogin.dependency.js';
import { LocalJwtBearerToken } from '@Contexts/Identity/Shared/infrastructure/Authentication/LocalJwtBearerToken.js';
import { UserPrismaRepository } from '@Contexts/Identity/User/infrastructure/persistence/UserPrismaRepository.js';
import { PrismaMusicianRepository } from '@Contexts/Musician/infrastructure/persistence/PrismaMusicianRepository.js';
import { MusicianSearchByEmail } from '@Contexts/Musician/application/searchByEmail/MusicianSearchByEmail.js';
import { MusicianSearchByEmailQueryHandler } from '@Contexts/Musician/application/searchByEmail/MusicianSearchByEmailQueryHandler.js';
import { MusicianSearchByUserIdQueryHandler } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserIdQueryHandler.js';
import { MusicianSearchByUserId } from '@Contexts/Musician/application/searchByUserId/MusicianSearchByUserId.js';
import { register as registerUserRegister } from '../use-cases/user/userRegister.dependency.js';
import { register as registerMusicianCreator } from '@Apps/moat/backend/config/dependency-injection/use-cases/musician/musicianCreator.dependency.js';
import { register as registerMusicianFindById } from '@Apps/moat/backend/config/dependency-injection/use-cases/musician/musicianFindById.dependency.js';
import { register as registerBandCreator } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandCreator.dependency.js';
import { register as registerBandListMembers } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandListMembers.dependency.js';
import { register as registerBandMemberAdder } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandMemberAdder.dependency.js';
import { register as registerBandUpdater } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandUpdater.dependency.js';
import { register as registerBandRemover } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandRemover.dependency.js';
import { register as registerBandFinder } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandFinder.dependency.js';
import { register as registerBandMatcher } from '@Apps/moat/backend/config/dependency-injection/use-cases/band/bandMatcher.dependency.js';
import { register as registerSongInstrumentBandMembershipGateway } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument/songInstrumentBandMembershipGateway.dependency.js';
import { register as registerSongInstrumentAssigner } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument/songInstrumentAssigner.dependency.js';
import { register as registerSongInstrumentEditor } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument/songInstrumentEditor.dependency.js';
import { register as registerSongInstrumentInviter } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument/songInstrumentInviter.dependency.js';
import { register as registerSongInstrumentCreator } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument/songInstrumentCreator.dependency.js';
import { register as registerSongInstrumentFindById } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument/songInstrumentFindById.dependency.js';
import { register as registerSongInstrumentMatcher } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument/songInstrumentMatcher.dependency.js';
import { register as registerDeletePreviousSongInstrumentVideo } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument-video/deletePreviousSongInstrumentVideo.dependency.js';
import { register as registerSongInstrumentVideoCreator } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument-video/songInstrumentVideoCreator.dependency.js';
import { register as registerSongInstrumentVideoUpdateStartTime } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument-video/songInstrumentVideoUpdateStartTime.dependency.js';
import { register as registerSongInstrumentUploadUploader } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument-upload/songInstrumentUploadUploader.dependency.js';
import { register as registerSongInstrumentUploadStatusUpdater } from '@Apps/moat/backend/config/dependency-injection/use-cases/song-instrument-upload/songInstrumentUploadStatusUpdater.dependency.js';
import { register as registerInstrumentsFinder } from '@Apps/moat/backend/config/dependency-injection/use-cases/instruments/instrumentsFinder.dependency.js';
import { register as registerInstrumentsMatcher } from '@Apps/moat/backend/config/dependency-injection/use-cases/instruments/instrumentsMatcher.dependency.js';
import { register as registerInstrumentsUpdater } from '@Apps/moat/backend/config/dependency-injection/use-cases/instruments/instrumentsUpdater.dependency.js';
import { BandPrismaRepository } from '@Contexts/Band/infrastructure/persistence/BandPrismaRepository.js';
import { SongPrismaRepository } from '@Contexts/Song/infrastructure/persistence/SongPrismaRepository.js';
import { SongCheckBandMembership } from '@Contexts/Song/application/checkBandMembership/SongCheckBandMembership.js';
import { SongCheckBandMembershipQueryHandler } from '@Contexts/Song/application/checkBandMembership/SongCheckBandMembershipQueryHandler.js';
import { SongCreator } from '@Contexts/Song/application/create/SongCreator.js';
import { CreateSongCommandHandler } from '@Contexts/Song/application/create/CreateSongCommandHandler.js';
import { EnrichSongOriginalVideoClipDurationCommandHandler } from '@Contexts/Song/application/enrichOriginalVideoClipDuration/EnrichSongOriginalVideoClipDurationCommandHandler.js';
import { SongOriginalVideoClipDurationEnricher } from '@Contexts/Song/application/enrichOriginalVideoClipDuration/SongOriginalVideoClipDurationEnricher.js';
import { SongListByBand } from '@Contexts/Song/application/listByBand/SongListByBand.js';
import { SongListByBandQueryHandler } from '@Contexts/Song/application/listByBand/SongListByBandQueryHandler.js';
import { YouTubeOriginalVideoClipDurationProvider } from '@Contexts/Song/infrastructure/YouTubeOriginalVideoClipDurationProvider.js';
import { register as registerSongMatcher } from '@Apps/moat/backend/config/dependency-injection/use-cases/song/songMatcher.dependency.js';
import { register as registerSongFindById } from '@Apps/moat/backend/config/dependency-injection/use-cases/song/songFindById.dependency.js';
import { SongInstrumentPrismaRepository } from '@Contexts/SongInstrument/SongInstrument/infrastructure/persistence/SongInstrumentPrismaRepository.js';
import { SongInstrumentVideoPrismaRepository } from '@Contexts/SongInstrument/Video/infrastructure/persistence/SongInstrumentVideoPrismaRepository.js';
import { SongInstrumentVideoFindBySongInstrumentId } from '@Contexts/SongInstrument/Video/application/findBySongInstrumentId/SongInstrumentVideoFindBySongInstrumentId.js';
import { FindSongInstrumentVideoBySongInstrumentIdQueryHandler } from '@Contexts/SongInstrument/Video/application/findBySongInstrumentId/FindSongInstrumentVideoBySongInstrumentIdQueryHandler.js';
import { SongInstrumentCheckSongOwnership } from '@Contexts/SongInstrument/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnership.js';
import { SongInstrumentCheckSongOwnershipQueryHandler } from '@Contexts/SongInstrument/SongInstrument/application/checkSongOwnership/SongInstrumentCheckSongOwnershipQueryHandler.js';
import { SongInstrumentUploadPrismaRepository } from '@Contexts/SongInstrument/Upload/infrastructure/persistence/SongInstrumentUploadPrismaRepository.js';
import { VideoclipPrismaRepository } from '@Contexts/Videoclip/infrastructure/persistence/VideoclipPrismaRepository.js';
import { InstrumentsPrismaRepository } from '@Contexts/Instruments/infrastructure/persistence/InstrumentsPrismaRepository.js';
import { ContainerBuilder, Reference } from 'node-dependency-injection';

import { InternalAuthentication } from '@Contexts/Identity/Shared/infrastructure/identityServer/internal/InternalAuthentication.js';
import { LocalJwtGenerator } from '@Contexts/Identity/User/infrastructure/service/LocalJwtGenerator.js';
import { BcryptPasswordEncryptor } from '@Contexts/Identity/User/infrastructure/auth/BcryptPasswordEncryptor.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';
import { HttpClient } from '@Contexts/Shared/infrastructure/Http/HttpClient.js';

export function registerMybandnowDependencies(container: ContainerBuilder) {
  // Authentication
  container
    .register('Identity.Shared.LocalJwtBearerToken', LocalJwtBearerToken)
    .addArgument(new Reference('Identity.User.UserRepository'));

  container
    .register('Identity.Shared.InternalAuthentication', InternalAuthentication)
    .addArgument(Buffer.from(env.KLODING_INTERNAL_PUBLIC_KEY_BASE64, 'base64').toString('utf8'));

  container.register('Identity.User.JwtGenerator', LocalJwtGenerator);
  container.register('Identity.User.PasswordEncryptor', BcryptPasswordEncryptor);

  // Repositories
  container.register('Identity.User.UserRepository', UserPrismaRepository).addArgument(new Reference('Shared.Outbox'));
  container
    .register('Musician.MusicianRepository', PrismaMusicianRepository)
    .addArgument(new Reference('Shared.Outbox'));
  container.register('Band.BandRepository', BandPrismaRepository).addArgument(new Reference('Shared.Outbox'));
  container.register('Song.SongRepository', SongPrismaRepository).addArgument(new Reference('Shared.Outbox'));
  container
    .register('Song.OriginalVideoClipDurationHttpClient', HttpClient)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(null)
    .addArgument({ integration: 'youtube' });
  container
    .register('Song.OriginalVideoClipDurationProvider', YouTubeOriginalVideoClipDurationProvider)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Song.OriginalVideoClipDurationHttpClient'));
  container
    .register('SongInstrument.SongInstrument.SongInstrumentRepository', SongInstrumentPrismaRepository)
    .addArgument(new Reference('Shared.Outbox'));
  container
    .register('SongInstrument.Video.SongInstrumentVideoRepository', SongInstrumentVideoPrismaRepository)
    .addArgument(new Reference('Shared.Outbox'));
  container
    .register('SongInstrument.Upload.SongInstrumentUploadRepository', SongInstrumentUploadPrismaRepository)
    .addArgument(new Reference('Shared.Outbox'));

  container
    .register('Videoclip.VideoclipRepository', VideoclipPrismaRepository)
    .addArgument(new Reference('Shared.Outbox'));
  container
    .register('Instruments.InstrumentsRepository', InstrumentsPrismaRepository)
    .addArgument(new Reference('Shared.Outbox'));

  // Use Cases
  registerUserLogin(container);
  registerUserRegister(container);
  registerMusicianCreator(container);
  registerMusicianFindById(container);
  registerBandCreator(container);
  registerBandListMembers(container);
  registerBandMemberAdder(container);
  registerBandUpdater(container);
  registerBandRemover(container);
  registerBandFinder(container);
  registerBandMatcher(container);
  container
    .register('Song.SongCreator', SongCreator)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Song.SongRepository'))
    .addArgument(new Reference('Shared.EventBus'));

  container
    .register('Song.CreateSongCommandHandler', CreateSongCommandHandler)
    .addArgument(new Reference('Song.SongCreator'))
    .addTag('commandHandler');

  container
    .register('Song.SongOriginalVideoClipDurationEnricher', SongOriginalVideoClipDurationEnricher)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Song.OriginalVideoClipDurationProvider'))
    .addArgument(new Reference('Song.SongRepository'));

  container
    .register(
      'Song.EnrichSongOriginalVideoClipDurationCommandHandler',
      EnrichSongOriginalVideoClipDurationCommandHandler
    )
    .addArgument(new Reference('Song.SongOriginalVideoClipDurationEnricher'))
    .addTag('commandHandler');

  registerSongInstrumentBandMembershipGateway(container);
  registerSongInstrumentAssigner(container);
  registerSongInstrumentEditor(container);
  registerSongInstrumentInviter(container);
  registerSongInstrumentCreator(container);
  registerSongInstrumentFindById(container);
  registerSongInstrumentMatcher(container);
  registerDeletePreviousSongInstrumentVideo(container);
  registerSongInstrumentVideoCreator(container);
  registerSongInstrumentVideoUpdateStartTime(container);
  registerSongInstrumentUploadUploader(container);
  registerSongInstrumentUploadStatusUpdater(container);
  registerInstrumentsFinder(container);
  registerInstrumentsMatcher(container);
  registerInstrumentsUpdater(container);

  container
    .register('Musician.MusicianSearchByUserId', MusicianSearchByUserId)
    .addArgument(new Reference('Musician.MusicianRepository'));

  container
    .register('Musician.MusicianSearchByEmail', MusicianSearchByEmail)
    .addArgument(new Reference('Musician.MusicianRepository'));

  container
    .register('Musician.MusicianSearchByUserIdQueryHandler', MusicianSearchByUserIdQueryHandler)
    .addArgument(new Reference('Musician.MusicianSearchByUserId'))
    .addTag('queryHandler');

  container
    .register('Musician.MusicianSearchByEmailQueryHandler', MusicianSearchByEmailQueryHandler)
    .addArgument(new Reference('Musician.MusicianSearchByEmail'))
    .addTag('queryHandler');

  container
    .register('Song.SongCheckBandMembership', SongCheckBandMembership)
    .addArgument(new Reference('Song.SongRepository'));

  container
    .register('Song.SongCheckBandMembershipQueryHandler', SongCheckBandMembershipQueryHandler)
    .addArgument(new Reference('Song.SongCheckBandMembership'))
    .addTag('queryHandler');

  container
    .register('Song.SongListByBand', SongListByBand)
    .addArgument(new Reference('Song.SongRepository'))
    .addArgument(new Reference('Song.SongRepository'));

  container
    .register('Song.SongListByBandQueryHandler', SongListByBandQueryHandler)
    .addArgument(new Reference('Song.SongListByBand'))
    .addTag('queryHandler');

  registerSongMatcher(container);
  registerSongFindById(container);

  container
    .register('SongInstrument.SongInstrument.SongInstrumentCheckSongOwnership', SongInstrumentCheckSongOwnership)
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentRepository'));

  container
    .register(
      'SongInstrument.SongInstrument.SongInstrumentCheckSongOwnershipQueryHandler',
      SongInstrumentCheckSongOwnershipQueryHandler
    )
    .addArgument(new Reference('SongInstrument.SongInstrument.SongInstrumentCheckSongOwnership'))
    .addTag('queryHandler');

  container
    .register(
      'SongInstrument.Video.SongInstrumentVideoFindBySongInstrumentId',
      SongInstrumentVideoFindBySongInstrumentId
    )
    .addArgument(new Reference('SongInstrument.Video.SongInstrumentVideoRepository'));

  container
    .register(
      'SongInstrument.Video.FindSongInstrumentVideoBySongInstrumentIdQueryHandler',
      FindSongInstrumentVideoBySongInstrumentIdQueryHandler
    )
    .addArgument(new Reference('SongInstrument.Video.SongInstrumentVideoFindBySongInstrumentId'))
    .addTag('queryHandler');
}
