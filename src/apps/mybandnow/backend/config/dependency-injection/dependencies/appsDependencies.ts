import { register as registerUserPostLoginController } from '../controllers/user/userPostLogin.dependency.js';
import { register as registerUserPostRegisterController } from '../controllers/user/userPostRegister.dependency.js';
import { register as registerProfileGetController } from '../controllers/musician/profileGet.dependency.js';
import { register as registerProfilePostController } from '../controllers/musician/profilePost.dependency.js';
import { ContainerBuilder, Reference } from 'node-dependency-injection';
import ContinuationLocalStorageExpress from '../../../middlewares/ContinuationLocalStorageExpress.js';
import CorrelationIdHeader from '../../../middlewares/CorrelationIdHeader.js';
import TraceReqAndRes from '../../../middlewares/TraceReqAndRes.js';
import { RabbitMQConfigFactory } from '@Contexts/Mybandnow/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConfigFactory.js';

export function registerAppsDependencies(container: ContainerBuilder) {
  // Initialization
  container.register('Apps.Mybandnow.Backend.RabbitMQConfig').setFactory(RabbitMQConfigFactory, 'createConfig');

  // Controllers
  registerUserPostLoginController(container);
  registerUserPostRegisterController(container);
  registerProfileGetController(container);
  registerProfilePostController(container);

  // Middlewares
  container
    .register('Apps.Mybandnow.Backend.middlewares.TraceReqAndRes', TraceReqAndRes)
    .addArgument(new Reference('Shared.BunyanLogger'));

  container.register('Apps.Mybandnow.Backend.middlewares.CorrelationIdHeader', CorrelationIdHeader);

  container
    .register('Apps.Mybandnow.Backend.middlewares.ContinuationLocalStorageExpress', ContinuationLocalStorageExpress)
    .addArgument(new Reference('Shared.Clock'));

  // Subscribers
}
