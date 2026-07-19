import { register as registerBandGetMatchByCriteriaController } from '../controllers/band/bandGetMatchByCriteria.dependency.js';
import { register as registerBandGetSearchController } from '../controllers/band/bandGetSearch.dependency.js';
import { register as registerBandDeleteRemoveController } from '../controllers/band/bandDeleteRemove.dependency.js';
import { register as registerBandPutUpdateController } from '../controllers/band/bandPutUpdate.dependency.js';
import { register as registerBandSongGetByBandController } from '../controllers/band/bandSongGetByBand.dependency.js';
import { register as registerBandSongPostCreateController } from '../controllers/band/bandSongPostCreate.dependency.js';
import { register as registerBandPostCreateController } from '../controllers/band/bandPostCreate.dependency.js';
import { register as registerUserPostLoginController } from '../controllers/user/userPostLogin.dependency.js';
import { register as registerUserPostRegisterController } from '../controllers/user/userPostRegister.dependency.js';
import { register as registerMusicianGetByIdController } from '../controllers/musician/musicianGetById.dependency.js';
import { register as registerProfileGetController } from '../controllers/musician/profileGet.dependency.js';
import { register as registerProfilePostController } from '../controllers/musician/profilePost.dependency.js';
import { register as registerSongGetMatchByCriteriaController } from '../controllers/song/songGetMatchByCriteria.dependency.js';
import { register as registerSongInstrumentGetByIdController } from '../controllers/songInstrument/songInstrumentGetById.dependency.js';
import { register as registerSongInstrumentGetMatchByCriteriaController } from '../controllers/songInstrument/songInstrumentGetMatchByCriteria.dependency.js';
import { register as registerSongInstrumentPatchVideoController } from '../controllers/songInstrument/songInstrumentPatchVideo.dependency.js';
import { register as registerSongInstrumentPostCreateController } from '../controllers/songInstrument/songInstrumentPostCreate.dependency.js';
import { register as registerSongInstrumentUploadPostUploadController } from '../controllers/songInstrumentUpload/songInstrumentUploadPostUpload.dependency.js';
import { register as registerInstrumentsGetMatchByCriteriaController } from '../controllers/instruments/instrumentsGetMatchByCriteria.dependency.js';
import { register as registerInstrumentsGetSearchController } from '../controllers/instruments/instrumentsGetSearch.dependency.js';
import { ContainerBuilder, Reference } from 'node-dependency-injection';
import ContinuationLocalStorageExpress from '../../../middlewares/ContinuationLocalStorageExpress.js';
import CorrelationIdHeader from '../../../middlewares/CorrelationIdHeader.js';
import { RequireMusicianProfileMiddleware } from '../../../middlewares/RequireMusicianProfileMiddleware.js';
import TraceReqAndRes from '../../../middlewares/TraceReqAndRes.js';
import { RabbitMQConfigFactory } from '@Contexts/Mybandnow/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConfigFactory.js';
import { ValidateSongInstrumentUploadOnUploadRequested } from '../../../subscribers/ValidateSongInstrumentUploadOnUploadRequested.js';
import { CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted } from '../../../subscribers/CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted.js';
import { FailSongInstrumentUploadOnSongInstrumentProcessFailed } from '../../../subscribers/FailSongInstrumentUploadOnSongInstrumentProcessFailed.js';
import { CreateSongInstrumentVideoOnSongInstrumentUploadCompleted } from '../../../subscribers/CreateSongInstrumentVideoOnSongInstrumentUploadCompleted.js';
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
  registerBandSongGetByBandController(container);
  registerBandSongPostCreateController(container);
  registerBandPostCreateController(container);
  registerUserPostLoginController(container);
  registerUserPostRegisterController(container);
  registerMusicianGetByIdController(container);
  registerProfileGetController(container);
  registerProfilePostController(container);
  registerSongGetMatchByCriteriaController(container);
  registerSongInstrumentGetByIdController(container);
  registerSongInstrumentGetMatchByCriteriaController(container);
  registerSongInstrumentPatchVideoController(container);
  registerSongInstrumentPostCreateController(container);
  registerSongInstrumentUploadPostUploadController(container);
  registerInstrumentsGetMatchByCriteriaController(container);
  registerInstrumentsGetSearchController(container);

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
    .register(
      'Apps.Mybandnow.Backend.subscribers.ValidateSongInstrumentUploadOnUploadRequested',
      ValidateSongInstrumentUploadOnUploadRequested
    )
    .addArgument('moat.song_instrument_upload.upload_requested')
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get<CommandBus>('Shared.CommandBus'))
    .addTag('domainEventSubscriber');

  container
    .register(
      'Apps.Mybandnow.Backend.subscribers.CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted',
      CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted
    )
    .addArgument('orchestrator.song_instrument_process.completed')
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get<CommandBus>('Shared.CommandBus'))
    .addTag('domainEventSubscriber');

  container
    .register(
      'Apps.Mybandnow.Backend.subscribers.FailSongInstrumentUploadOnSongInstrumentProcessFailed',
      FailSongInstrumentUploadOnSongInstrumentProcessFailed
    )
    .addArgument('orchestrator.song_instrument_process.failed')
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get<CommandBus>('Shared.CommandBus'))
    .addTag('domainEventSubscriber');

  container
    .register(
      'Apps.Mybandnow.Backend.subscribers.CreateSongInstrumentVideoOnSongInstrumentUploadCompleted',
      CreateSongInstrumentVideoOnSongInstrumentUploadCompleted
    )
    .addArgument('moat.song_instrument_upload.completed')
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get<CommandBus>('Shared.CommandBus'))
    .addTag('domainEventSubscriber');
}
