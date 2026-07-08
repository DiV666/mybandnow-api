import { ContainerBuilder, Reference, TagReference } from 'node-dependency-injection';
import config from '../../config.js';
import { CommandHandlersInformation } from '@Contexts/Shared/infrastructure/CommandBus/CommandHandlersInformation.js';
import { InMemoryCommandBus } from '@Contexts/Shared/infrastructure/CommandBus/InMemoryCommandBus.js';
import ApiExceptionListener from '@Contexts/Shared/infrastructure/Express/ApiExceptionListener.js';
import ApiExceptionsHttpStatusCodeMapping from '@Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import BunyanLogger from '@Contexts/Shared/infrastructure/Logger/BunyanLogger.js';
import { MongoClientFactory } from '@Contexts/Shared/infrastructure/persistence/mongo/MongoClientFactory.js';
import { InMemoryQueryBus } from '@Contexts/Shared/infrastructure/QueryBus/InMemoryQueryBus.js';
import { QueryHandlersInformation } from '@Contexts/Shared/infrastructure/QueryBus/QueryHandlersInformation.js';
import { RabbitMQConnection } from '@Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConnection.js';
import { RabbitMQQueueFormatter } from '@Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQQueueFormatter.js';
import { RabbitMQEventBusFactory } from '@Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQEventBusFactory.js';
import { OutboxPrismaRepository } from '@Contexts/Shared/infrastructure/EventBus/Outbox/OutboxPrismaRepository.js';
import { OutboxEventBus } from '@Contexts/Shared/infrastructure/EventBus/Outbox/OutboxEventBus.js';
import { OutboxPublisher } from '@Contexts/Shared/infrastructure/EventBus/Outbox/OutboxPublisher.js';
import { DomainEventJsonDeserializer } from '@Contexts/Shared/infrastructure/EventBus/DomainEventJsonDeserializer.js';
import { DomainEventSubscribers } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscribers.js';
import { KeycloakClientFactory } from '@Contexts/Shared/infrastructure/identityServer/keycloak/KeycloakClientFactory.js';
import { AppBootstrapService } from '@Contexts/Shared/application/services/AppBootstrapService.js';
import { CriteriaScopeSecurity } from '@Contexts/Shared/application/security/CriteriaScopeSecurity.js';
import healthStatus from '@Contexts/Shared/infrastructure/health.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';
import { SystemClock } from '@Contexts/Shared/infrastructure/Clock/SystemClock.js';

export function registerSharedDependencies(container: ContainerBuilder) {
  container.register('Shared.Clock', SystemClock);

  container.register('Shared.CriteriaScopeSecurity', CriteriaScopeSecurity);

  container.register('Shared.BunyanLogger', BunyanLogger).addArgument(config.logger);

  container.register('Shared.Express.ApiExceptionsHttpStatusCodeMapping', ApiExceptionsHttpStatusCodeMapping);

  container
    .register('Shared.Express.ApiExceptionListener', ApiExceptionListener)
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.Express.ApiExceptionsHttpStatusCodeMapping'));

  container
    .register('Shared.MongoConnectionManager')
    .addArgument('mybandnow')
    .addArgument(new Reference('Apps.Mybandnow.Backend.MongoConfig'))
    .addArgument(new Reference('Shared.BunyanLogger'))
    .setFactory(MongoClientFactory, 'createClient');

  container
    .register('Shared.MongoAnalyticsConnectionManager')
    .addArgument('mybandnow-analytics')
    .addArgument(new Reference('Apps.Mybandnow.Backend.MongoAnalyticsConfig'))
    .addArgument(new Reference('Shared.BunyanLogger'))
    .setFactory(MongoClientFactory, 'createClient');

  container
    .register('Shared.KeycloakConnectionManager')
    .addArgument('mybandnow')
    .addArgument(new Reference('Apps.Mybandnow.Backend.KeyCloakConfig'))
    .setFactory(KeycloakClientFactory, 'createClient');

  container
    .register('Shared.CommandHandlersInformation', CommandHandlersInformation)
    .addArgument(new TagReference('commandHandler'));

  container
    .register('Shared.CommandBus', InMemoryCommandBus)
    .addArgument(new Reference('Shared.CommandHandlersInformation'));

  container
    .register('Shared.DomainEventSubscribers', DomainEventSubscribers)
    .addArgument(new TagReference('domainEventSubscriber'));

  container
    .register('Shared.RabbitMQConnection', RabbitMQConnection)
    .addArgument(new Reference('Apps.Mybandnow.Backend.RabbitMQConfig'))
    .addArgument(new Reference('Shared.BunyanLogger'));

  container.register('Shared.RabbitMQQueueFormatter', RabbitMQQueueFormatter).addArgument('mybandnow');

  // RabbitMQEventBus (inner bus for Outbox)
  container
    .register('Shared.RabbitMQEventBus')
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(new Reference('Shared.RabbitMQConnection'))
    .addArgument(new Reference('Shared.RabbitMQQueueFormatter'))
    .addArgument(new Reference('Apps.Mybandnow.Backend.RabbitMQConfig'))
    .addArgument(new Reference('Shared.Clock'))
    .addArgument(new Reference('Shared.DomainEventSubscribers'))
    .setFactory(RabbitMQEventBusFactory, 'create');

  // Outbox Pattern components
  container
    .register('Shared.Outbox', OutboxPrismaRepository)
    .addArgument(5000); // pendingGraceMs — consistent with OutboxPublisher pollIntervalMs

  container.register('Shared.DomainEventJsonDeserializer', DomainEventJsonDeserializer);

  // OutboxEventBus (wraps RabbitMQEventBus with Outbox Pattern)
  container
    .register('Shared.EventBus', OutboxEventBus)
    .addArgument(new Reference('Shared.Outbox'))
    .addArgument(new Reference('Shared.RabbitMQEventBus'))
    .addArgument(new Reference('Shared.BunyanLogger'));

  // OutboxPublisher (background poller)
  container
    .register('Shared.OutboxPublisher', OutboxPublisher)
    .addArgument(new Reference('Shared.Outbox'))
    .addArgument(new Reference('Shared.RabbitMQEventBus'))
    .addArgument(new Reference('Shared.DomainEventJsonDeserializer'))
    .addArgument(new Reference('Shared.BunyanLogger'))
    .addArgument(5000) // pollIntervalMs
    .addArgument(100) // batchSize
    .addArgument(3); // maxRetries

  container
    .register('Shared.QueryHandlersInformation', QueryHandlersInformation)
    .addArgument(new TagReference('queryHandler'));

  container.register('Shared.QueryBus', InMemoryQueryBus).addArgument(new Reference('Shared.QueryHandlersInformation'));

  // Services
  container
    .register('Shared.AppBootstrapService', AppBootstrapService)
    .addArgument(healthStatus)
    .addArgument(env.SENTRY_DSN)
    .addArgument(env.NODE_ENV)
    .addArgument(process.env.npm_package_version ?? '0.0.0');
}
