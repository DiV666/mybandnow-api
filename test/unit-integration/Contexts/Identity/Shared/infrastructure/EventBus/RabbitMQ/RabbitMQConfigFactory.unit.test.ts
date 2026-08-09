import { describe, it, expect } from 'vitest';
import { RabbitMQConfigFactory } from '../../../../../../../../src/Contexts/Mybandnow/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConfigFactory.js';
import { RabbitMQConfig } from '../../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConfig.js';

describe('RabbitMQConfigFactory', () => {
  it('should build RabbitMQConfig reading from environment variables', () => {
    const config: RabbitMQConfig = RabbitMQConfigFactory.createConfig();

    // Assert that the factory correctly maps each env var — values come from the container env.
    expect(config.connectionSettings.username).toBe(process.env.RABBITMQ_USERNAME);
    expect(config.connectionSettings.password).toBe(process.env.RABBITMQ_PASSWORD);
    expect(config.connectionSettings.vhost).toBe(process.env.RABBITMQ_VHOST);
    expect(config.connectionSettings.connection.secure).toBe(process.env.RABBITMQ_SECURE === 'true');
    expect(config.connectionSettings.connection.hostname).toBe(process.env.RABBITMQ_HOSTNAME);
    expect(config.connectionSettings.connection.port).toBe(parseInt(process.env.RABBITMQ_PORT as string));
    expect(config.exchangeSettings.name).toBe(process.env.RABBITMQ_EXCHANGE_NAME);
    expect(config.maxRetries).toBe(parseInt(process.env.RABBITMQ_MAX_RETRIES as string));
    expect(config.retryTtl).toBe(parseInt(process.env.RABBITMQ_RETRY_TTL as string));
  });
});
