import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import { ConsumeMessage } from 'amqplib';
import { RabbitMQConsumer } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConsumer.js';
import { RabbitMQConnection } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConnection.js';
import { DomainEventSubscriber } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';
import { DomainEvent } from '../../../../../../../src/Contexts/Shared/domain/DomainEvent.js';
import Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import { Exception } from '../../../../../../../src/Contexts/Shared/domain/Exception.js';
import { FakeClock } from '../../../../../../utils/mocks/FakeClock.js';
import { NonRetryableException } from '../../../../../../../src/Contexts/Shared/domain/exceptions/NonRetryableException.js';
import ContinuationLocalStorage from '../../../../../../../src/Contexts/Shared/infrastructure/Sessions/ContinuationLocalStorage.js';

type NamedDomainEventSubscriber = DomainEventSubscriber & {
  name(): string;
};

function createDomainEventMessage(params?: {
  readonly correlationId?: string;
  readonly includeMeta?: boolean;
  readonly routingKey?: string;
  readonly aggregateId?: string;
  readonly eventName?: string;
  readonly redeliveryCount?: number;
}): ConsumeMessage {
  const {
    correlationId = 'corr-123',
    includeMeta = true,
    routingKey = 'test.key',
    aggregateId = 'agg-123',
    eventName = 'test.event',
    redeliveryCount
  } = params ?? {};

  const eventData: Record<string, unknown> = {
    eventId: 'event-123',
    eventName,
    aggregateId,
    occurredOn: '2026-06-09T16:42:39.252Z',
    attributes: {}
  };

  if (includeMeta) {
    eventData.meta = correlationId ? { 'x-correlation-id': correlationId } : {};
  }

  return {
    content: Buffer.from(
      JSON.stringify({
        data: eventData
      })
    ),
    fields: {
      deliveryTag: 1,
      redelivered: false,
      exchange: 'test',
      routingKey,
      consumerTag: 'tag-1'
    },
    properties: {
      headers: typeof redeliveryCount === 'number' ? { redelivery_count: redeliveryCount } : {},
      contentType: undefined,
      contentEncoding: undefined,
      deliveryMode: undefined,
      priority: undefined,
      correlationId: undefined,
      replyTo: undefined,
      expiration: undefined,
      messageId: undefined,
      timestamp: undefined,
      type: undefined,
      userId: undefined,
      appId: undefined,
      clusterId: undefined
    }
  };
}

describe('RabbitMQConsumer unit test', () => {
  let logger: MockProxy<Logger>;
  let subscriber: MockProxy<NamedDomainEventSubscriber>;
  let connection: MockProxy<RabbitMQConnection>;
  let consumer: RabbitMQConsumer;
  let clock: FakeClock;
  const queueName = 'test-queue';
  const exchange = 'test-exchange';
  const maxRetries = 3;

  beforeEach(() => {
    logger = mock<Logger>();
    subscriber = mock<NamedDomainEventSubscriber>();
    connection = mock<RabbitMQConnection>();
    clock = new FakeClock();

    consumer = new RabbitMQConsumer({
      logger,
      subscriber,
      connection,
      queueName,
      exchange,
      maxRetries,
      clock
    });

    // Default successful subscriber behavior
    subscriber.on.mockResolvedValue(undefined);
    subscriber.handlerException.mockReturnValue(undefined);
  });

  describe('onMessage', () => {
    it('should process a valid message successfully and ack it', async () => {
      // Arrange
      const occurredOnStr = '2026-06-09T16:42:39.252Z';
      const domainEvent = {
        eventId: 'event-123',
        eventName: 'test.event',
        aggregateId: 'agg-123',
        occurredOn: occurredOnStr,
        meta: { 'x-correlation-id': 'corr-123' },
        attributes: {},
        // Mock constructor with fromPrimitives for proper deserialization
        constructor: {
          fromPrimitives: (params: {
            aggregateId: string;
            eventId: string;
            occurredOn: Date;
            attributes: Record<string, unknown>;
            meta?: Record<string, unknown>;
          }) => ({
            ...params,
            eventName: 'test.event',
            aggregateId: params.aggregateId,
            eventId: params.eventId,
            occurredOn: params.occurredOn instanceof Date ? params.occurredOn : new Date(params.occurredOn),
            attributes: params.attributes,
            meta: params.meta
          })
        }
      };

      const message: ConsumeMessage = {
        content: Buffer.from(JSON.stringify({ data: domainEvent })),
        fields: { deliveryTag: 1, redelivered: false, exchange: 'test', routingKey: 'test.key', consumerTag: 'tag-1' },
        properties: {
          headers: {},
          contentType: undefined,
          contentEncoding: undefined,
          deliveryMode: undefined,
          priority: undefined,
          correlationId: undefined,
          replyTo: undefined,
          expiration: undefined,
          messageId: undefined,
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined
        }
      };

      // Act - AsyncLocalStorage.run() is async-safe, no setTimeout needed
      await consumer.onMessage(message);

      // Assert - immediate assertion, context survived the entire async chain
      const [consumedEvent] = subscriber.on.mock.calls[0] ?? [];

      expect(consumedEvent).toBeInstanceOf(DomainEvent);
      expect(consumedEvent).toBeDefined();
      expect(consumedEvent?.eventId).toBe('event-123');
      expect(consumedEvent?.eventName).toBe('test.event');
      expect(consumedEvent?.aggregateId).toBe('agg-123');
      expect(consumedEvent?.meta).toEqual({ 'x-correlation-id': 'corr-123' });
      expect(consumedEvent?.attributes).toEqual({});
      expect(consumedEvent?.occurredOn).toBeInstanceOf(Date);
      expect(connection.ack).toHaveBeenCalledWith(message);
    });

    it('should keep backward compatibility for valid events without meta', async () => {
      // Arrange
      const message = createDomainEventMessage({
        includeMeta: false
      });

      // Act
      await consumer.onMessage(message);

      // Assert
      const [consumedEvent] = subscriber.on.mock.calls[0] ?? [];

      expect(consumedEvent).toBeInstanceOf(DomainEvent);
      expect(consumedEvent?.eventId).toBe('event-123');
      expect(consumedEvent?.eventName).toBe('test.event');
      expect(consumedEvent?.aggregateId).toBe('agg-123');
      expect(consumedEvent?.attributes).toEqual({});
      expect(consumedEvent?.meta).toEqual({});
      expect(consumedEvent?.occurredOn).toBeInstanceOf(Date);
      expect(connection.ack).toHaveBeenCalledWith(message);
      expect(connection.retry).not.toHaveBeenCalled();
    });

    it('should retry message if JSON parsing fails and retry count is below max', async () => {
      // Arrange - malformed JSON will trigger the catch block
      const message: ConsumeMessage = {
        content: Buffer.from('{ invalid json }'),
        fields: { deliveryTag: 1, redelivered: false, exchange: 'test', routingKey: 'test.key', consumerTag: 'tag-1' },
        properties: {
          headers: {},
          contentType: 'application/json',
          contentEncoding: 'utf-8',
          deliveryMode: undefined,
          priority: undefined,
          correlationId: undefined,
          replyTo: undefined,
          expiration: undefined,
          messageId: 'msg-123',
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined
        }
      };

      // Act
      await consumer.onMessage(message);

      // Assert - immediate assertion, no race condition
      expect(connection.retry).toHaveBeenCalledWith(message, 'test-queue', 'test-exchange');
      expect(connection.ack).toHaveBeenCalledWith(message);
    });

    it('should classify invalid domain event structures as TypeError before retrying', async () => {
      // Arrange
      const message: ConsumeMessage = {
        content: Buffer.from(JSON.stringify({ data: { aggregateId: 'agg-123' } })),
        fields: { deliveryTag: 1, redelivered: false, exchange: 'test', routingKey: 'test.key', consumerTag: 'tag-1' },
        properties: {
          headers: {},
          contentType: 'application/json',
          contentEncoding: 'utf-8',
          deliveryMode: undefined,
          priority: undefined,
          correlationId: undefined,
          replyTo: undefined,
          expiration: undefined,
          messageId: 'msg-456',
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined
        }
      };

      // Act
      await consumer.onMessage(message);

      // Assert
      expect(connection.retry).toHaveBeenCalledWith(message, 'test-queue', 'test-exchange');
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'TypeError'
        }),
        expect.stringContaining('Message consumption failed from queue <test-queue>')
      );
    });

    it('should keep classifying malformed meta payloads as TypeError before retrying', async () => {
      // Arrange
      const message: ConsumeMessage = {
        content: Buffer.from(
          JSON.stringify({
            data: {
              eventId: 'event-123',
              eventName: 'test.event',
              aggregateId: 'agg-123',
              occurredOn: '2026-06-09T16:42:39.252Z',
              meta: 'invalid-meta',
              attributes: {}
            }
          })
        ),
        fields: { deliveryTag: 1, redelivered: false, exchange: 'test', routingKey: 'test.key', consumerTag: 'tag-1' },
        properties: {
          headers: {},
          contentType: 'application/json',
          contentEncoding: 'utf-8',
          deliveryMode: undefined,
          priority: undefined,
          correlationId: undefined,
          replyTo: undefined,
          expiration: undefined,
          messageId: 'msg-789',
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined
        }
      };

      // Act
      await consumer.onMessage(message);

      // Assert
      expect(connection.retry).toHaveBeenCalledWith(message, 'test-queue', 'test-exchange');
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'TypeError'
        }),
        expect.stringContaining('Message consumption failed from queue <test-queue>')
      );
    });

    it('should send message to dead letter if JSON parsing fails and retry count exceeds max retries', async () => {
      // Arrange - malformed JSON will trigger the catch block
      const message: ConsumeMessage = {
        content: Buffer.from('{ invalid json }'),
        fields: { deliveryTag: 1, redelivered: false, exchange: 'test', routingKey: 'test.key', consumerTag: 'tag-1' },
        properties: {
          headers: { redelivery_count: 3 },
          contentType: 'application/json',
          contentEncoding: 'utf-8',
          deliveryMode: undefined,
          priority: undefined,
          correlationId: undefined,
          replyTo: undefined,
          expiration: undefined,
          messageId: 'msg-123',
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined
        }
      };

      // Act
      await consumer.onMessage(message);

      // Assert - immediate assertion
      expect(connection.deadLetter).toHaveBeenCalledWith(message, 'test-queue', 'test-exchange');
      expect(connection.ack).toHaveBeenCalledWith(message);
    });

    it('should nack message if handleError also fails', async () => {
      // Arrange - malformed JSON will trigger the catch block, and retry will fail
      const message: ConsumeMessage = {
        content: Buffer.from('{ invalid json }'),
        fields: { deliveryTag: 1, redelivered: false, exchange: 'test', routingKey: 'test.key', consumerTag: 'tag-1' },
        properties: {
          headers: {},
          contentType: 'application/json',
          contentEncoding: 'utf-8',
          deliveryMode: undefined,
          priority: undefined,
          correlationId: undefined,
          replyTo: undefined,
          expiration: undefined,
          messageId: 'msg-123',
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined
        }
      };

      connection.retry.mockRejectedValue(new Error('Retry failed'));

      // Act
      await consumer.onMessage(message);

      // Assert - immediate assertion
      expect(connection.nack).toHaveBeenCalledWith(message, false, true);
      expect(connection.ack).not.toHaveBeenCalled();
    });

    it('should dead-letter and ack when handlerException raises a NonRetryableException', async () => {
      // Arrange
      const message = createDomainEventMessage({
        correlationId: 'corr-non-retryable',
        routingKey: 'entity.created',
        aggregateId: 'aggregate-non-retryable',
        eventName: 'kloding-mybandnow-1-command-entity-created'
      });
      const originalError = new Exception({ message: 'business invariant broken' });

      subscriber.on.mockRejectedValue(originalError);
      subscriber.handlerException.mockImplementation(() => {
        throw new NonRetryableException(originalError);
      });

      // Act
      await consumer.onMessage(message);

      // Assert
      expect(connection.deadLetter).toHaveBeenCalledWith(message, 'test-queue', 'test-exchange');
      expect(connection.ack).toHaveBeenCalledWith(message);
      expect(connection.retry).not.toHaveBeenCalled();
      expect(connection.nack).not.toHaveBeenCalled();
    });

    it('should nack for redelivery when dead-lettering a NonRetryableException fails', async () => {
      // Arrange
      const message = createDomainEventMessage({
        correlationId: 'corr-dead-letter-failure',
        routingKey: 'entity.created',
        aggregateId: 'aggregate-dead-letter-failure',
        eventName: 'kloding-mybandnow-1-command-entity-created'
      });
      const originalError = new Exception({ message: 'business invariant broken' });

      subscriber.on.mockRejectedValue(originalError);
      subscriber.handlerException.mockImplementation(() => {
        throw new NonRetryableException(originalError);
      });
      connection.deadLetter.mockRejectedValue(new Error('dead-letter unavailable'));

      // Act
      await consumer.onMessage(message);

      // Assert
      expect(connection.deadLetter).toHaveBeenCalledWith(message, 'test-queue', 'test-exchange');
      expect(connection.nack).toHaveBeenCalledWith(message, false, true);
      expect(connection.ack).not.toHaveBeenCalled();
      expect(connection.retry).not.toHaveBeenCalled();
    });

    it('should use random correlation ID if not present in message metadata', async () => {
      // Arrange
      const occurredOnStr = '2026-06-09T16:42:39.252Z';
      const domainEvent = {
        eventId: 'event-123',
        eventName: 'test.event',
        aggregateId: 'agg-123',
        occurredOn: occurredOnStr,
        meta: {}, // No correlation ID
        attributes: {},
        // Mock constructor with fromPrimitives for proper deserialization
        constructor: {
          fromPrimitives: (params: {
            aggregateId: string;
            eventId: string;
            occurredOn: Date;
            attributes: Record<string, unknown>;
            meta?: Record<string, unknown>;
          }) => ({
            ...params,
            eventName: 'test.event',
            aggregateId: params.aggregateId,
            eventId: params.eventId,
            occurredOn: params.occurredOn instanceof Date ? params.occurredOn : new Date(params.occurredOn),
            attributes: params.attributes,
            meta: params.meta
          })
        }
      };

      const message: ConsumeMessage = {
        content: Buffer.from(JSON.stringify({ data: domainEvent })),
        fields: { deliveryTag: 1, redelivered: false, exchange: 'test', routingKey: 'test.key', consumerTag: 'tag-1' },
        properties: {
          headers: {},
          contentType: undefined,
          contentEncoding: undefined,
          deliveryMode: undefined,
          priority: undefined,
          correlationId: undefined,
          replyTo: undefined,
          expiration: undefined,
          messageId: undefined,
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined
        }
      };

      // Act
      await consumer.onMessage(message);

      // Assert - immediate assertion
      const [consumedEvent] = subscriber.on.mock.calls[0] ?? [];

      expect(consumedEvent).toBeInstanceOf(DomainEvent);
      expect(consumedEvent?.eventId).toBe('event-123');
      expect(consumedEvent?.eventName).toBe('test.event');
      expect(consumedEvent?.aggregateId).toBe('agg-123');
      expect(consumedEvent?.attributes).toEqual({});
      expect(consumedEvent?.meta).toEqual({});
      expect(consumedEvent?.occurredOn).toBeInstanceOf(Date);
      expect(connection.ack).toHaveBeenCalledWith(message);
    });

    it('should log when a message is received and consumed successfully', async () => {
      // Arrange
      clock.freeze(new Date('2026-06-30T11:00:00.000Z'));
      const message = createDomainEventMessage({
        correlationId: 'corr-success',
        routingKey: 'entity.created',
        aggregateId: 'aggregate-success',
        eventName: 'kloding-mybandnow-1-command-entity-created',
        redeliveryCount: 2
      });

      subscriber.name.mockReturnValue('CreateAuditOnEntityCreated');
      subscriber.on.mockImplementation(async () => {
        clock.advance(250);
      });

      // Act
      await consumer.onMessage(message);

      // Assert
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        {
          queueName: 'test-queue',
          subscriberName: 'CreateAuditOnEntityCreated',
          eventName: 'kloding-mybandnow-1-command-entity-created',
          routingKey: 'entity.created',
          aggregateId: 'aggregate-success',
          correlationId: 'corr-success',
          redeliveryCount: 2
        },
        'Message received from queue <test-queue> and consumed by <CreateAuditOnEntityCreated>'
      );

      expect(logger.info).toHaveBeenNthCalledWith(
        2,
        {
          queueName: 'test-queue',
          subscriberName: 'CreateAuditOnEntityCreated',
          eventName: 'kloding-mybandnow-1-command-entity-created',
          routingKey: 'entity.created',
          aggregateId: 'aggregate-success',
          correlationId: 'corr-success',
          redeliveryCount: 2,
          duration: 250
        },
        'Message consumed successfully from queue <test-queue> by <CreateAuditOnEntityCreated>'
      );
    });

    it('should log a safe failure when message consumption fails', async () => {
      // Arrange
      const message = createDomainEventMessage({
        correlationId: 'corr-failure',
        routingKey: 'entity.created',
        aggregateId: 'aggregate-failure',
        eventName: 'kloding-mybandnow-1-command-entity-created',
        redeliveryCount: 1
      });
      const error = new Error('top-secret payload leaked');

      subscriber.name.mockReturnValue('CreateAuditOnEntityCreated');
      subscriber.on.mockRejectedValue(error);

      // Act
      await consumer.onMessage(message);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        {
          queueName: 'test-queue',
          subscriberName: 'CreateAuditOnEntityCreated',
          eventName: 'kloding-mybandnow-1-command-entity-created',
          routingKey: 'entity.created',
          aggregateId: 'aggregate-failure',
          correlationId: 'corr-failure',
          redeliveryCount: 1,
          errorType: 'Error'
        },
        'Message consumption failed from queue <test-queue> by <CreateAuditOnEntityCreated>'
      );

      expect(JSON.stringify(logger.error.mock.calls)).not.toContain('top-secret payload leaked');
      // Regression: the same failure must be logged exactly once, not duplicated
      expect(logger.error).toHaveBeenCalledTimes(1);
    });

    it('omits duration from the success log when the CLS context is unavailable', async () => {
      // Arrange
      const message = createDomainEventMessage();
      const getContextSpy = vi.spyOn(ContinuationLocalStorage, 'getContext').mockReturnValue(null);

      // Act
      await consumer.onMessage(message);

      // Assert
      expect(logger.info).toHaveBeenNthCalledWith(
        2,
        expect.not.objectContaining({ duration: expect.anything() }),
        expect.stringContaining('Message consumed successfully')
      );
      getContextSpy.mockRestore();
    });

    it('treats a message with no data key as an invalid structure before retrying', async () => {
      // Arrange
      const message: ConsumeMessage = {
        content: Buffer.from(JSON.stringify({ notData: {} })),
        fields: { deliveryTag: 1, redelivered: false, exchange: 'test', routingKey: 'test.key', consumerTag: 'tag-1' },
        properties: {
          headers: {},
          contentType: 'application/json',
          contentEncoding: 'utf-8',
          deliveryMode: undefined,
          priority: undefined,
          correlationId: undefined,
          replyTo: undefined,
          expiration: undefined,
          messageId: 'msg-no-data',
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined
        }
      };

      // Act
      await consumer.onMessage(message);

      // Assert — extractRawEvent and deserializeDomainEvent both bail out on the missing 'data' key
      expect(connection.retry).toHaveBeenCalledWith(message, 'test-queue', 'test-exchange');
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: 'TypeError', eventName: undefined, aggregateId: undefined }),
        expect.stringContaining('Message consumption failed')
      );
    });

    it('rejects a non-record rawEvent.data before validating individual fields', async () => {
      // Arrange
      const message: ConsumeMessage = {
        content: Buffer.from(JSON.stringify({ data: 'not-an-object' })),
        fields: { deliveryTag: 1, redelivered: false, exchange: 'test', routingKey: 'test.key', consumerTag: 'tag-1' },
        properties: {
          headers: {},
          contentType: 'application/json',
          contentEncoding: 'utf-8',
          deliveryMode: undefined,
          priority: undefined,
          correlationId: undefined,
          replyTo: undefined,
          expiration: undefined,
          messageId: 'msg-data-string',
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined
        }
      };

      // Act
      await consumer.onMessage(message);

      // Assert
      expect(connection.retry).toHaveBeenCalledWith(message, 'test-queue', 'test-exchange');
    });

    it('rejects an occurredOn value that does not parse into a valid date', async () => {
      // Arrange
      const message: ConsumeMessage = {
        content: Buffer.from(
          JSON.stringify({
            data: {
              eventId: 'event-123',
              eventName: 'test.event',
              aggregateId: 'agg-123',
              occurredOn: 'not-a-date',
              attributes: {}
            }
          })
        ),
        fields: { deliveryTag: 1, redelivered: false, exchange: 'test', routingKey: 'test.key', consumerTag: 'tag-1' },
        properties: {
          headers: {},
          contentType: 'application/json',
          contentEncoding: 'utf-8',
          deliveryMode: undefined,
          priority: undefined,
          correlationId: undefined,
          replyTo: undefined,
          expiration: undefined,
          messageId: 'msg-bad-date',
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined
        }
      };

      // Act
      await consumer.onMessage(message);

      // Assert
      expect(connection.retry).toHaveBeenCalledWith(message, 'test-queue', 'test-exchange');
    });

    it('classifies a non-Error thrown by the subscriber as UnknownError', async () => {
      // Arrange
      const message = createDomainEventMessage();

      subscriber.on.mockRejectedValue('plain-string-failure');

      // Act
      await consumer.onMessage(message);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: 'UnknownError' }),
        expect.stringContaining('Message consumption failed')
      );
      expect(connection.retry).toHaveBeenCalledWith(message, 'test-queue', 'test-exchange');
    });

    it('classifies a non-Error dead-letter failure as UnknownError when nacking a NonRetryableException', async () => {
      // Arrange
      const message = createDomainEventMessage();
      const originalError = new Exception({ message: 'business invariant broken' });
      subscriber.on.mockRejectedValue(originalError);
      subscriber.handlerException.mockImplementation(() => {
        throw new NonRetryableException(originalError);
      });

      connection.deadLetter.mockRejectedValue('dead-letter-unavailable');

      // Act
      await consumer.onMessage(message);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: 'UnknownError' }),
        expect.stringContaining('nacking for redelivery')
      );
      expect(connection.nack).toHaveBeenCalledWith(message, false, true);
    });

    it('classifies a non-Error handleError failure as UnknownError when nacking for redelivery', async () => {
      // Arrange — malformed JSON triggers the catch block, which then goes through retry()
      const message: ConsumeMessage = {
        content: Buffer.from('{ invalid json }'),
        fields: { deliveryTag: 1, redelivered: false, exchange: 'test', routingKey: 'test.key', consumerTag: 'tag-1' },
        properties: {
          headers: {},
          contentType: 'application/json',
          contentEncoding: 'utf-8',
          deliveryMode: undefined,
          priority: undefined,
          correlationId: undefined,
          replyTo: undefined,
          expiration: undefined,
          messageId: 'msg-retry-fails',
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined
        }
      };

      connection.retry.mockRejectedValue('retry-unavailable');

      // Act
      await consumer.onMessage(message);

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: 'UnknownError' }),
        expect.stringContaining('nacking for redelivery')
      );
      expect(connection.nack).toHaveBeenCalledWith(message, false, true);
      expect(connection.ack).not.toHaveBeenCalled();
    });

    it('falls back to the empty headers object in hasBeenRedeliveredTooMuch when properties.headers is undefined', async () => {
      // Arrange — malformed JSON triggers the catch block and reaches handleError(),
      // where properties.headers is undefined (not just an empty object)
      const message: ConsumeMessage = {
        content: Buffer.from('{ invalid json }'),
        fields: { deliveryTag: 1, redelivered: false, exchange: 'test', routingKey: 'test.key', consumerTag: 'tag-1' },
        properties: {
          headers: undefined as unknown as Record<string, unknown>,
          contentType: 'application/json',
          contentEncoding: 'utf-8',
          deliveryMode: undefined,
          priority: undefined,
          correlationId: undefined,
          replyTo: undefined,
          expiration: undefined,
          messageId: 'msg-no-headers-error-path',
          timestamp: undefined,
          type: undefined,
          userId: undefined,
          appId: undefined,
          clusterId: undefined
        }
      };

      // Act
      await consumer.onMessage(message);

      // Assert — hasBeenRedeliveredTooMuch falls back to {}, treats it as not-redelivered, and retries
      expect(connection.retry).toHaveBeenCalledWith(message, 'test-queue', 'test-exchange');
      expect(connection.ack).toHaveBeenCalledWith(message);
    });

    it('treats a missing redelivery_count header as zero and falls back to the empty headers object', async () => {
      // Arrange — properties.headers itself is undefined (not just an empty object)
      const message = createDomainEventMessage();
      (message.properties as unknown as { headers: unknown }).headers = undefined;

      // Act
      await consumer.onMessage(message);

      // Assert — redeliveryCount() falls back to {} and reports 0
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ redeliveryCount: 0 }),
        expect.any(String)
      );
    });

    it('treats a non-numeric redelivery_count header as zero', async () => {
      // Arrange
      const message = createDomainEventMessage();
      (message.properties as unknown as { headers: unknown }).headers = { redelivery_count: 'not-a-number' };

      // Act
      await consumer.onMessage(message);

      // Assert
      expect(logger.info).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ redeliveryCount: 0 }),
        expect.any(String)
      );
    });
  });

  describe('hasBeenRedelivered (defensive fallback)', () => {
    it('falls back to message.properties.headers when no currentHeaders argument is passed', () => {
      // Arrange — this branch is unreachable through the public onMessage() flow today
      // (hasBeenRedeliveredTooMuch always supplies a truthy headers object), so it is
      // exercised directly to keep the defensive fallback covered.
      const message = {
        properties: { headers: { redelivery_count: 2 } }
      } as unknown as ConsumeMessage;

      // Act
      // @ts-expect-error - accessing private method for testing
      const result = consumer.hasBeenRedelivered(message);

      // Assert
      expect(result).toBe(true);
    });
  });
});
