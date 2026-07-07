import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { MongoConfigFactory } from '@Contexts/Mybandnow/Shared/infrastructure/persistence/mongo/MongoConfigFactory.js';
import ContinuationLocalStorageExpress from '../../../middlewares/ContinuationLocalStorageExpress.js';
import CorrelationIdHeader from '../../../middlewares/CorrelationIdHeader.js';
import TraceReqAndRes from '../../../middlewares/TraceReqAndRes.js';
import { RabbitMQConfigFactory } from '@Contexts/Mybandnow/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConfigFactory.js';
import { KeycloakConfigFactory } from '@Contexts/Shared/infrastructure/identityServer/keycloak/KeycloakConfigFactory.js';

export function registerAppsDependencies(container: ContainerBuilder) {
  // Initialization
  container.register('Apps.Mybandnow.Backend.MongoConfig').setFactory(MongoConfigFactory, 'createConfig');
  container
    .register('Apps.Mybandnow.Backend.MongoAnalyticsConfig')
    .setFactory(MongoConfigFactory, 'createAnalyticsConfig');
  container.register('Apps.Mybandnow.Backend.RabbitMQConfig').setFactory(RabbitMQConfigFactory, 'createConfig');
  container.register('Apps.Mybandnow.Backend.KeyCloakConfig').setFactory(KeycloakConfigFactory, 'createConfig');

  // Controllers

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
