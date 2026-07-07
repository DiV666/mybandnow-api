import { describe, it, expect, vi } from 'vitest';
import { RabbitMQConnection } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConnection.js';
import { RabbitMQEventBus } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQEventBus.js';
import { RabbitMQQueueFormatter } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQQueueFormatter.js';
import { DomainEventDummyMother } from '../../../../../../utils/mocks/DomainEventDummy.js';
import Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import { mock, MockProxy } from 'vitest-mock-extended';
import { RabbitMQConfig } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConfig.js';
import { RabbitMQEventBusFactory } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQEventBusFactory.js';
import { FakeClock } from '../../../../../../utils/mocks/FakeClock.js';
import { DomainEventSubscribers } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/DomainEventSubscribers.js';
import ContinuationLocalStorage from '../../../../../../../src/Contexts/Shared/infrastructure/Sessions/ContinuationLocalStorage.js';

describe('RabbitMQEventBus unit test', () => {
  const exchange = 'test_domain_events';
  const logger: MockProxy<Logger> = mock<Logger>();
  const queueNameFormatter = new RabbitMQQueueFormatter('mybandnow');
  const clock = new FakeClock();
  const subscribers = new DomainEventSubscribers([]);

  it('should log the primary failure and rethrow if publish to RabbitMQ fails', async () => {
    // Arrange
    const connection = mock<RabbitMQConnection>();
    const publishError = new Error('broker unreachable');
    connection.publish.mockRejectedValue(publishError);
    const eventBus = new RabbitMQEventBus({
      logger,
      connection,
      exchange,
      queueNameFormatter,
      maxRetries: 3,
      retryTtl: 3000,
      clock,
      subscribers
    });
    const event = DomainEventDummyMother.random();

    // Act & Assert — the caller (OutboxEventBus) keeps the event pending and owns the retry
    await expect(eventBus.publish([event])).rejects.toThrow('broker unreachable');
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({ errorType: 'Error' }),
      'Primary publish to RabbitMQ failed'
    );
  });

  it('should create an instance of RabbitMQEventBus', () => {
    const logger = mock<Logger>();
    const connection = mock<RabbitMQConnection>();
    const queueNameFormatter = mock<RabbitMQQueueFormatter>();
    const config: RabbitMQConfig = {
      exchangeSettings: { name: 'test_exchange' },
      maxRetries: 3,
      retryTtl: 1000,
      connectionSettings: {
        username: 'guest',
        password: 'guest',
        vhost: '/',
        connection: {
          secure: false,
          hostname: 'localhost',
          port: 5672
        }
      }
    };

    const eventBus = RabbitMQEventBusFactory.create(logger, connection, queueNameFormatter, config, clock, subscribers);

    expect(eventBus).toBeInstanceOf(RabbitMQEventBus);
  });

  it('should preserve event immutability while publishing correlation-id enriched metadata', async () => {
    const connection = mock<RabbitMQConnection>();
    connection.publish.mockResolvedValue(null);
    const eventBus = new RabbitMQEventBus({
      logger,
      connection,
      exchange,
      queueNameFormatter,
      maxRetries: 3,
      retryTtl: 3000,
      clock,
      subscribers
    });
    const event = DomainEventDummyMother.random();
    event.meta = { source: 'rabbit-test' };
    vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue({
      correlationId: 'corr-rabbit',
      requestTime: 1
    });

    await eventBus.publish([event]);

    const publishedPayload = connection.publish.mock.calls[0]?.[0]?.content.toString('utf-8');

    expect(publishedPayload).toContain('corr-rabbit');
    expect(publishedPayload).toContain('rabbit-test');
    expect(event.meta).toEqual({ source: 'rabbit-test' });
  });

  describe('start', () => {
    it('should connect and configure the exchange/queues', async () => {
      // Arrange
      const connection = mock<RabbitMQConnection>();
      const eventBus = new RabbitMQEventBus({
        logger,
        connection,
        exchange,
        queueNameFormatter,
        maxRetries: 3,
        retryTtl: 3000,
        clock,
        subscribers
      });

      // Act
      await eventBus.start();

      // Assert
      expect(connection.connect).toHaveBeenCalled();
      expect(connection.exchange).toHaveBeenCalledWith({ name: exchange });
    });

    it('should register a consumer for every subscriber', async () => {
      // Arrange
      const connection = mock<RabbitMQConnection>();
      const subscriber = {
        subscribedTo: () => ['test.event'],
        on: vi.fn()
      };
      const subscribersWithOne = new DomainEventSubscribers([subscriber as never]);
      const eventBus = new RabbitMQEventBus({
        logger,
        connection,
        exchange,
        queueNameFormatter,
        maxRetries: 3,
        retryTtl: 3000,
        clock,
        subscribers: subscribersWithOne
      });

      // Act
      await eventBus.start();

      // Assert
      expect(connection.consume).toHaveBeenCalledTimes(1);
      expect(connection.consume).toHaveBeenCalledWith(expect.any(String), expect.any(Function));
    });
  });

  describe('stop', () => {
    it('should close the underlying connection', async () => {
      // Arrange
      const connection = mock<RabbitMQConnection>();
      const eventBus = new RabbitMQEventBus({
        logger,
        connection,
        exchange,
        queueNameFormatter,
        maxRetries: 3,
        retryTtl: 3000,
        clock,
        subscribers
      });

      // Act
      await eventBus.stop();

      // Assert
      expect(connection.close).toHaveBeenCalled();
    });
  });

  describe('publish — non-Error failures', () => {
    it('classifies a non-Error publish failure as UnknownError and rethrows it', async () => {
      // Arrange — reset CLS context so an earlier test's mock doesn't leak correlation-id metadata
      vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue(null);
      const connection = mock<RabbitMQConnection>();

      connection.publish.mockRejectedValue('broker-unreachable');
      const eventBus = new RabbitMQEventBus({
        logger,
        connection,
        exchange,
        queueNameFormatter,
        maxRetries: 3,
        retryTtl: 3000,
        clock,
        subscribers
      });
      const event = DomainEventDummyMother.random();

      // Act & Assert
      await expect(eventBus.publish([event])).rejects.toBe('broker-unreachable');
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: 'UnknownError' }),
        'Primary publish to RabbitMQ failed'
      );
    });
  });
});
