import { register as registerBandGetMatchByCriteriaController } from '../controllers/band/bandGetMatchByCriteria.dependency.js';
import { register as registerBandGetSearchController } from '../controllers/band/bandGetSearch.dependency.js';
import { register as registerBandDeleteRemoveController } from '../controllers/band/bandDeleteRemove.dependency.js';
import { register as registerBandMemberGetByBandController } from '../controllers/band/bandMemberGetByBand.dependency.js';
import { register as registerBandMemberPostCreateController } from '../controllers/band/bandMemberPostCreate.dependency.js';
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
import { register as registerSongInstrumentPatchAssignController } from '../controllers/songInstrument/songInstrumentPatchAssign.dependency.js';
import { register as registerSongInstrumentPatchEditController } from '../controllers/songInstrument/songInstrumentPatchEdit.dependency.js';
import { register as registerSongInstrumentPatchVideoController } from '../controllers/songInstrument/songInstrumentPatchVideo.dependency.js';
import { register as registerSongInstrumentPostCreateController } from '../controllers/songInstrument/songInstrumentPostCreate.dependency.js';
import { register as registerSongInstrumentPostInviteController } from '../controllers/songInstrument/songInstrumentPostInvite.dependency.js';
import { register as registerSongInstrumentUploadPostUploadController } from '../controllers/songInstrumentUpload/songInstrumentUploadPostUpload.dependency.js';
import { register as registerSongInstrumentUploadPostUploadConfirmController } from '../controllers/songInstrumentUpload/songInstrumentUploadPostUploadConfirm.dependency.js';
import { register as registerSongVideoclipPostRequestController } from '../controllers/videoclip/songVideoclipPostRequest.dependency.js';
import { register as registerSongVideoclipDeleteCancelController } from '../controllers/videoclip/songVideoclipDeleteCancel.dependency.js';
import { register as registerInstrumentsGetMatchByCriteriaController } from '../controllers/instruments/instrumentsGetMatchByCriteria.dependency.js';
import { register as registerInstrumentsGetSearchController } from '../controllers/instruments/instrumentsGetSearch.dependency.js';
import { register as registerInstrumentsPutUpdateController } from '../controllers/instruments/instrumentsPutUpdate.dependency.js';
import { ContainerBuilder, Reference } from 'node-dependency-injection';
import ContinuationLocalStorageExpress from '../../../middlewares/ContinuationLocalStorageExpress.js';
import CorrelationIdHeader from '../../../middlewares/CorrelationIdHeader.js';
import { RequireMusicianProfileMiddleware } from '../../../middlewares/RequireMusicianProfileMiddleware.js';
import TraceReqAndRes from '../../../middlewares/TraceReqAndRes.js';
import { RabbitMQConfigFactory } from '@Contexts/Identity/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConfigFactory.js';
import { ValidateSongInstrumentUploadOnUploadRequested } from '../../../subscribers/ValidateSongInstrumentUploadOnUploadRequested.js';
import { CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted } from '../../../subscribers/CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted.js';
import { FailSongInstrumentUploadOnSongInstrumentProcessFailed } from '../../../subscribers/FailSongInstrumentUploadOnSongInstrumentProcessFailed.js';
import { CreateSongInstrumentVideoOnSongInstrumentUploadCompleted } from '../../../subscribers/CreateSongInstrumentVideoOnSongInstrumentUploadCompleted.js';
import { DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced } from '../../../subscribers/DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced.js';
import { EnrichSongOriginalVideoClipDurationOnSongCreated } from '../../../subscribers/EnrichSongOriginalVideoClipDurationOnSongCreated.js';
import { CompleteVideoclipOnVideoclipGenerationCompleted } from '../../../subscribers/CompleteVideoclipOnVideoclipGenerationCompleted.js';
import { FailVideoclipOnVideoclipGenerationFailed } from '../../../subscribers/FailVideoclipOnVideoclipGenerationFailed.js';
import { SongCreatedDomainEvent } from '@Contexts/Song/domain/SongCreatedDomainEvent.js';
import type { CommandBus } from '@Contexts/Shared/domain/CommandBus.js';

export function registerAppsDependencies(container: ContainerBuilder) {
  // Initialization
  container.register('Apps.Mybandnow.Backend.RabbitMQConfig').setFactory(RabbitMQConfigFactory, 'createConfig');

  // Controllers
  registerBandGetMatchByCriteriaController(container);
  registerBandGetSearchController(container);
  registerBandDeleteRemoveController(container);
  registerBandMemberGetByBandController(container);
  registerBandMemberPostCreateController(container);
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
  registerSongInstrumentPatchAssignController(container);
  registerSongInstrumentPatchEditController(container);
  registerSongInstrumentPatchVideoController(container);
  registerSongInstrumentPostCreateController(container);
  registerSongInstrumentPostInviteController(container);
  registerSongInstrumentUploadPostUploadController(container);
  registerSongInstrumentUploadPostUploadConfirmController(container);
  registerSongVideoclipPostRequestController(container);
  registerSongVideoclipDeleteCancelController(container);
  registerInstrumentsGetMatchByCriteriaController(container);
  registerInstrumentsGetSearchController(container);
  registerInstrumentsPutUpdateController(container);

  // Middlewares
  container
    .register('Apps.Mybandnow.Backend.middlewares.TraceReqAndRes', TraceReqAndRes)
    .addArgument(new Reference('Shared.BunyanLogger'));

  container.register('Apps.Mybandnow.Backend.middlewares.CorrelationIdHeader', CorrelationIdHeader);

  container
    .register('Apps.Mybandnow.Backend.middlewares.ContinuationLocalStorageExpress', ContinuationLocalStorageExpress)
    .addArgument(new Reference('Shared.Clock'));

  container
    .register('Apps.Mybandnow.Backend.middlewares.RequireMusicianProfileMiddleware', RequireMusicianProfileMiddleware)
    .addArgument(new Reference('Musician.MusicianSearchByUserId'));

  // Subscribers
  container
    .register(
      'Apps.Mybandnow.Backend.subscribers.ValidateSongInstrumentUploadOnUploadRequested',
      ValidateSongInstrumentUploadOnUploadRequested
    )
    .addArgument('song_instrument.1.upload.requested')
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get<CommandBus>('Shared.CommandBus'))
    .addArgument(new Reference('Song.SongRepository'))
    .addTag('domainEventSubscriber');

  container
    .register(
      'Apps.Mybandnow.Backend.subscribers.CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted',
      CompleteSongInstrumentUploadOnSongInstrumentProcessCompleted
    )
    .addArgument('orchestrator.1.song_instrument_process.completed')
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get<CommandBus>('Shared.CommandBus'))
    .addTag('domainEventSubscriber');

  container
    .register(
      'Apps.Mybandnow.Backend.subscribers.FailSongInstrumentUploadOnSongInstrumentProcessFailed',
      FailSongInstrumentUploadOnSongInstrumentProcessFailed
    )
    .addArgument('orchestrator.1.song_instrument_process.failed')
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get<CommandBus>('Shared.CommandBus'))
    .addTag('domainEventSubscriber');

  container
    .register(
      'Apps.Mybandnow.Backend.subscribers.CreateSongInstrumentVideoOnSongInstrumentUploadCompleted',
      CreateSongInstrumentVideoOnSongInstrumentUploadCompleted
    )
    .addArgument('song_instrument.1.upload.completed')
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get<CommandBus>('Shared.CommandBus'))
    .addTag('domainEventSubscriber');

  container
    .register(
      'Apps.Mybandnow.Backend.subscribers.DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced',
      DeletePreviousSongInstrumentVideoOnSongInstrumentVideoReplaced
    )
    .addArgument('song_instrument.1.video.replaced')
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get<CommandBus>('Shared.CommandBus'))
    .addTag('domainEventSubscriber');

  container
    .register(
      'Apps.Mybandnow.Backend.subscribers.EnrichSongOriginalVideoClipDurationOnSongCreated',
      EnrichSongOriginalVideoClipDurationOnSongCreated
    )
    .addArgument(SongCreatedDomainEvent.EVENT_NAME)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get<CommandBus>('Shared.CommandBus'))
    .addTag('domainEventSubscriber');

  container
    .register(
      'Apps.Mybandnow.Backend.subscribers.CompleteVideoclipOnVideoclipGenerationCompleted',
      CompleteVideoclipOnVideoclipGenerationCompleted
    )
    .addArgument('videoclip_worker.1.videoclip_generation.completed')
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get<CommandBus>('Shared.CommandBus'))
    .addTag('domainEventSubscriber');

  container
    .register(
      'Apps.Mybandnow.Backend.subscribers.FailVideoclipOnVideoclipGenerationFailed',
      FailVideoclipOnVideoclipGenerationFailed
    )
    .addArgument('videoclip_worker.1.videoclip_generation.failed')
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(() => container.get<CommandBus>('Shared.CommandBus'))
    .addTag('domainEventSubscriber');
}
