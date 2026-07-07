import Logger from '../../../domain/Logger.js';
import { RabbitMQConfig } from './RabbitMQConfig.js';
import { RabbitMQConnection } from './RabbitMQConnection.js';
import { RabbitMQEventBus } from './RabbitMQEventBus.js';
import { RabbitMQQueueFormatter } from './RabbitMQQueueFormatter.js';
import { Clock } from '../../../domain/Clock.js';
import { DomainEventSubscribers } from '../DomainEventSubscribers.js';

export class RabbitMQEventBusFactory {
  static create(
    logger: Logger,
    connection: RabbitMQConnection,
    queueNameFormatter: RabbitMQQueueFormatter,
    config: RabbitMQConfig,
    clock: Clock,
    subscribers: DomainEventSubscribers
  ): RabbitMQEventBus {
    return new RabbitMQEventBus({
      logger,
      connection,
      exchange: config.exchangeSettings.name,
      queueNameFormatter: queueNameFormatter,
      maxRetries: config.maxRetries,
      retryTtl: config.retryTtl,
      clock,
      subscribers
    });
  }
}
