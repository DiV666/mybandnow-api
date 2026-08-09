import { RabbitMQConfig } from '@Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConfig.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';

export class RabbitMQConfigFactory {
  static createConfig(): RabbitMQConfig {
    return {
      connectionSettings: {
        username: env.RABBITMQ_USERNAME,
        password: env.RABBITMQ_PASSWORD,
        vhost: env.RABBITMQ_VHOST,
        connection: {
          secure: env.RABBITMQ_SECURE,
          hostname: env.RABBITMQ_HOSTNAME,
          port: env.RABBITMQ_PORT
        }
      },
      exchangeSettings: {
        name: env.RABBITMQ_EXCHANGE_NAME
      },
      maxRetries: env.RABBITMQ_MAX_RETRIES,
      retryTtl: env.RABBITMQ_RETRY_TTL
    };
  }
}
