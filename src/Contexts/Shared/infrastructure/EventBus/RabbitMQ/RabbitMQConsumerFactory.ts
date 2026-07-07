import Logger from '../../../domain/Logger.js';
import { DomainEventSubscriber } from '../DomainEventSubscriber.js';
import { RabbitMQConnection } from './RabbitMQConnection.js';
import { RabbitMQConsumer } from './RabbitMQConsumer.js';
import { Clock } from '../../../domain/Clock.js';

export class RabbitMQConsumerFactory {
  constructor(
    private logger: Logger,
    private connection: RabbitMQConnection,
    private maxRetries: number,
    private clock: Clock
  ) {}

  build(subscriber: DomainEventSubscriber, exchange: string, queueName: string) {
    return new RabbitMQConsumer({
      logger: this.logger,
      subscriber,
      connection: this.connection,
      queueName,
      exchange,
      maxRetries: this.maxRetries,
      clock: this.clock
    });
  }
}
