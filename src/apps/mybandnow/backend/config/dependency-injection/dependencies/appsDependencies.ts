import { register as registerBandGetMatchByCriteriaController } from '../controllers/band/bandGetMatchByCriteria.dependency.js';
import { register as registerBandGetSearchController } from '../controllers/band/bandGetSearch.dependency.js';
import { register as registerBandDeleteRemoveController } from '../controllers/band/bandDeleteRemove.dependency.js';
import { register as registerBandPutUpdateController } from '../controllers/band/bandPutUpdate.dependency.js';
import { register as registerBandPostCreateController } from '../controllers/band/bandPostCreate.dependency.js';
import { register as registerUserPostLoginController } from '../controllers/user/userPostLogin.dependency.js';
import { register as registerUserPostRegisterController } from '../controllers/user/userPostRegister.dependency.js';
import { register as registerMusicianGetByIdController } from '../controllers/musician/musicianGetById.dependency.js';
import { register as registerProfileGetController } from '../controllers/musician/profileGet.dependency.js';
import { register as registerProfilePostController } from '../controllers/musician/profilePost.dependency.js';
import { register as registerSongInstrumentPostCreateController } from '../controllers/songInstrument/songInstrumentPostCreate.dependency.js';
import { register as registerTrackPostUploadController } from '../controllers/track/trackPostUpload.dependency.js';
import { ContainerBuilder, Reference } from 'node-dependency-injection';
import ContinuationLocalStorageExpress from '../../../middlewares/ContinuationLocalStorageExpress.js';
import CorrelationIdHeader from '../../../middlewares/CorrelationIdHeader.js';
import { RequireMusicianProfileMiddleware } from '../../../middlewares/RequireMusicianProfileMiddleware.js';
import TraceReqAndRes from '../../../middlewares/TraceReqAndRes.js';
import { RabbitMQConfigFactory } from '@Contexts/Mybandnow/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConfigFactory.js';
import { ValidateTrackOnUploadRequested } from '../../../subscribers/ValidateTrackOnUploadRequested.js';
import type { CommandBus } from '@Contexts/Shared/domain/CommandBus.js';
import { MultipartFileParser } from '@Contexts/Shared/infrastructure/Express/MultipartFileParser.js';

export function registerAppsDependencies(container: ContainerBuilder) {
  // Initialization
  container.register('Apps.Mybandnow.Backend.RabbitMQConfig').setFactory(RabbitMQConfigFactory, 'createConfig');

  // Controllers
  registerBandGetMatchByCriteriaController(container);
  registerBandGetSearchController(container);
  registerBandDeleteRemoveController(container);
  registerBandPutUpdateController(container);
  registerBandPostCreateController(container);
  registerUserPostLoginController(container);
  registerUserPostRegisterController(container);
  registerMusicianGetByIdController(container);
  registerProfileGetController(container);
  registerProfilePostController(container);
  registerSongInstrumentPostCreateController(container);
  registerTrackPostUploadController(container);

  // Middlewares
  container.register('Shared.Express.MultipartFileParser', MultipartFileParser);

  container
    .register('Apps.Mybandnow.Backend.middlewares.TraceReqAndRes', TraceReqAndRes)
    .addArgument(new Reference('Shared.BunyanLogger'));

  container.register('Apps.Mybandnow.Backend.middlewares.CorrelationIdHeader', CorrelationIdHeader);

  container
    .register('Apps.Mybandnow.Backend.middlewares.ContinuationLocalStorageExpress', ContinuationLocalStorageExpress)
    .addArgument(new Reference('Shared.Clock'));

  container
    .register('Apps.Mybandnow.Backend.middlewares.RequireMusicianProfileMiddleware', RequireMusicianProfileMiddleware)
    .addArgument(new Reference('Moat.Musician.MusicianSearchByUserId'));

  // Subscribers
  container
    .register('Apps.Mybandnow.Backend.subscribers.ValidateTrackOnUploadRequested', ValidateTrackOnUploadRequested)
    .addArgument('moat.track.upload_requested')
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get<CommandBus>('Shared.CommandBus'))
    .addTag('domainEventSubscriber');
}
