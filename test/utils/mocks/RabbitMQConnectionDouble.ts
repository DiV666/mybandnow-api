import { RabbitMQConnection } from '@Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConnection.js';

export class RabbitMQConnectionDouble extends RabbitMQConnection {
  async publish(): Promise<boolean> {
    throw new Error();
  }
}
