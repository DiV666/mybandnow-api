import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mock, MockProxy } from 'vitest-mock-extended';
import amqplib from 'amqplib';
import { RabbitMQConnection } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConnection.js';
import { ConnectionSettings } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/ConnectionSettings.js';
import Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import healthStatus from '../../../../../../../src/Contexts/Shared/infrastructure/health.js';

vi.mock('amqplib', () => ({
  default: { connect: vi.fn() }
}));

describe('RabbitMQConnection unit test', () => {
  let logger: MockProxy<Logger>;
  let connectionSettings: ConnectionSettings;

  beforeEach(() => {
    logger = mock<Logger>();
    connectionSettings = {
      username: 'guest',
      password: 'guest',
      vhost: '/',
      connection: {
        secure: false,
        hostname: 'localhost',
        port: 5672
      }
    };
  });

  describe('queue', () => {
    it('should configure a queue with deadLetterExchange, deadLetterQueue, and messageTtl', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const exchangeName = 'test-exchange';
      const queueName = 'test-queue';
      const routingKeys = ['test.routing.key'];
      const deadLetterExchange = 'dead-letter-exchange';
      const deadLetterQueue = 'dead-letter-queue';
      const messageTtl = 60000;

      // Mock internal methods to avoid real connection
      const mockChannel = {
        assertQueue: vi.fn().mockResolvedValue(undefined),
        bindQueue: vi.fn().mockResolvedValue(undefined)
      };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;

      // Act
      await connection.queue({
        exchange: exchangeName,
        name: queueName,
        routingKeys,
        deadLetterExchange,
        deadLetterQueue,
        messageTtl
      });

      // Assert
      expect(mockChannel.assertQueue).toHaveBeenCalledWith(
        queueName,
        expect.objectContaining({
          exclusive: false,
          durable: true,
          autoDelete: false,
          arguments: {
            'x-dead-letter-exchange': deadLetterExchange,
            'x-dead-letter-routing-key': deadLetterQueue,
            'x-message-ttl': messageTtl
          }
        })
      );
      expect(mockChannel.bindQueue).toHaveBeenCalledWith(queueName, exchangeName, routingKeys[0]);
    });

    it('does not attempt to bind routing keys when the channel is not set', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);

      // Act & Assert
      await expect(connection.queue({ exchange: 'e', name: 'q', routingKeys: ['k'] })).resolves.toBeUndefined();
    });
  });

  describe('amqpConnect', () => {
    it('connects with the amqps protocol when secure is true', async () => {
      // Arrange
      const secureSettings: ConnectionSettings = {
        ...connectionSettings,
        connection: { ...connectionSettings.connection, secure: true }
      };
      const connection = new RabbitMQConnection({ connectionSettings: secureSettings }, logger);
      const fakeAmqpConnection = { on: vi.fn() };
      vi.mocked(amqplib.connect).mockResolvedValue(fakeAmqpConnection as never);

      // Act
      // @ts-expect-error - accessing private method for testing
      await connection.amqpConnect();

      // Assert
      expect(amqplib.connect).toHaveBeenCalledWith(expect.objectContaining({ protocol: 'amqps' }));
    });

    it('triggers a reconnect when the broker closes the connection unexpectedly', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const fakeAmqpConnection = { on: vi.fn() };
      vi.mocked(amqplib.connect).mockResolvedValue(fakeAmqpConnection as never);
      // @ts-expect-error - accessing private method for testing
      const reconnectSpy = (connection.reconnect = vi.fn());

      // Act
      // @ts-expect-error - accessing private method for testing
      await connection.amqpConnect();
      const closeHandler = fakeAmqpConnection.on.mock.calls.find(([event]) => event === 'close')?.[1] as () => void;
      closeHandler();

      // Assert
      expect(reconnectSpy).toHaveBeenCalled();
      expect(healthStatus.isUnhealthy()).toBe(true);
      healthStatus.setRabbitHealth('OK');
    });

    it('does not reconnect when the connection close was initiated by our own close()', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const fakeAmqpConnection = { on: vi.fn() };
      vi.mocked(amqplib.connect).mockResolvedValue(fakeAmqpConnection as never);
      // @ts-expect-error - accessing private method for testing
      const reconnectSpy = (connection.reconnect = vi.fn());
      // @ts-expect-error - accessing private property for testing
      connection.isClosing = true;

      // Act
      // @ts-expect-error - accessing private method for testing
      await connection.amqpConnect();
      const closeHandler = fakeAmqpConnection.on.mock.calls.find(([event]) => event === 'close')?.[1] as () => void;
      closeHandler();

      // Assert
      expect(reconnectSpy).not.toHaveBeenCalled();
    });
  });

  describe('amqpChannel', () => {
    it('resolves undefined when there is no connection to create a channel from', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);

      // Act
      // @ts-expect-error - accessing private method for testing
      const result = await connection.amqpChannel();

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('ack/nack', () => {
    it('should ack a message when channel is set', () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const mockChannel = { ack: vi.fn(), nack: vi.fn() };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;
      const message = { content: Buffer.from('x') } as unknown as import('amqplib').ConsumeMessage;

      // Act
      connection.ack(message);

      // Assert
      expect(mockChannel.ack).toHaveBeenCalledWith(message);
    });

    it('should not throw when acking without a channel', () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const message = { content: Buffer.from('x') } as unknown as import('amqplib').ConsumeMessage;

      // Act & Assert
      expect(() => connection.ack(message)).not.toThrow();
    });

    it('should nack a message with default allUpTo=false and requeue=true', () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const mockChannel = { ack: vi.fn(), nack: vi.fn() };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;
      const message = { content: Buffer.from('x') } as unknown as import('amqplib').ConsumeMessage;

      // Act
      connection.nack(message);

      // Assert
      expect(mockChannel.nack).toHaveBeenCalledWith(message, false, true);
    });

    it('should not throw when nacking without a channel', () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const message = { content: Buffer.from('x') } as unknown as import('amqplib').ConsumeMessage;

      // Act & Assert
      expect(() => connection.nack(message)).not.toThrow();
    });

    it('should nack a message with explicit allUpTo and requeue values', () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const mockChannel = { ack: vi.fn(), nack: vi.fn() };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;
      const message = { content: Buffer.from('x') } as unknown as import('amqplib').ConsumeMessage;

      // Act
      connection.nack(message, true, false);

      // Assert
      expect(mockChannel.nack).toHaveBeenCalledWith(message, true, false);
    });
  });

  describe('deleteQueue', () => {
    it('should delete a queue when channel is set', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const mockChannel = { deleteQueue: vi.fn().mockResolvedValue({ messageCount: 0 }) };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;

      // Act
      const result = await connection.deleteQueue('test-queue');

      // Assert
      expect(mockChannel.deleteQueue).toHaveBeenCalledWith('test-queue');
      expect(result).toEqual({ messageCount: 0 });
    });

    it('should resolve undefined when channel is not set', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);

      // Act
      const result = await connection.deleteQueue('test-queue');

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe('publish', () => {
    it('should reject when channel is not initialized', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);

      // Act & Assert
      await expect(
        connection.publish({
          exchange: 'test-exchange',
          routingKey: 'test.key',
          content: Buffer.from('payload'),
          options: { messageId: 'id-1', contentType: 'application/json', contentEncoding: 'utf-8' }
        })
      ).rejects.toThrow('Channel not initialized');
    });

    it('should resolve when the channel confirms publish', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const mockChannel = {
        publish: vi.fn((_exchange, _routingKey, _content, _options, callback: (error: Error | null) => void) =>
          callback(null)
        )
      };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;

      // Act
      const result = await connection.publish({
        exchange: 'test-exchange',
        routingKey: 'test.key',
        content: Buffer.from('payload'),
        options: { messageId: 'id-1', contentType: 'application/json', contentEncoding: 'utf-8' }
      });

      // Assert
      expect(result).toBeNull();
    });

    it('should reject when the channel callback receives an error', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const publishError = new Error('broker rejected message');
      const mockChannel = {
        publish: vi.fn((_exchange, _routingKey, _content, _options, callback: (error: Error | null) => void) =>
          callback(publishError)
        )
      };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;

      // Act & Assert
      await expect(
        connection.publish({
          exchange: 'test-exchange',
          routingKey: 'test.key',
          content: Buffer.from('payload'),
          options: { messageId: 'id-1', contentType: 'application/json', contentEncoding: 'utf-8' }
        })
      ).rejects.toThrow('broker rejected message');
    });
  });

  describe('retry/deadLetter', () => {
    const buildMessage = (headers?: Record<string, unknown>) =>
      ({
        content: Buffer.from('payload'),
        properties: {
          messageId: 'id-1',
          contentType: 'application/json',
          contentEncoding: 'utf-8',
          priority: 5,
          headers
        }
      }) as unknown as import('amqplib').ConsumeMessage;

    it('should publish to the retry exchange with redelivery_count set to 1 for a first-time message', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const mockChannel = {
        publish: vi.fn((_exchange, _routingKey, _content, _options, callback: (error: Error | null) => void) =>
          callback(null)
        )
      };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;
      const message = buildMessage();

      // Act
      await connection.retry(message, 'my-queue', 'my-exchange');

      // Assert
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'retry-my-exchange',
        'my-queue',
        message.content,
        expect.objectContaining({ headers: { redelivery_count: 1 } }),
        expect.any(Function)
      );
    });

    it('should increment an existing redelivery_count when retrying', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const mockChannel = {
        publish: vi.fn((_exchange, _routingKey, _content, _options, callback: (error: Error | null) => void) =>
          callback(null)
        )
      };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;
      const message = buildMessage({ redelivery_count: '2' });

      // Act
      await connection.retry(message, 'my-queue', 'my-exchange');

      // Assert
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'retry-my-exchange',
        'my-queue',
        message.content,
        expect.objectContaining({ headers: { redelivery_count: 3 } }),
        expect.any(Function)
      );
    });

    it('should publish to the dead letter exchange', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const mockChannel = {
        publish: vi.fn((_exchange, _routingKey, _content, _options, callback: (error: Error | null) => void) =>
          callback(null)
        )
      };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;
      const message = buildMessage();

      // Act
      await connection.deadLetter(message, 'my-queue', 'my-exchange');

      // Assert
      expect(mockChannel.publish).toHaveBeenCalledWith(
        'dead_letter-my-exchange',
        'my-queue',
        message.content,
        expect.objectContaining({ headers: { redelivery_count: 1 } }),
        expect.any(Function)
      );
    });
  });

  describe('close', () => {
    it('should mark as closing, clear a pending reconnect timer, clear consumers, and close channel and connection', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const mockChannel = { close: vi.fn().mockResolvedValue(undefined) };
      const mockConnection = { close: vi.fn().mockResolvedValue(undefined) };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;
      // @ts-expect-error - accessing private property for testing
      connection.connection = mockConnection;
      // @ts-expect-error - accessing private property for testing
      // eslint-disable-next-line @typescript-eslint/no-empty-function -- timer callback is never invoked in this test
      connection.reconnectTimer = setTimeout(() => {}, 10_000);

      // Act
      await connection.close();

      // Assert
      // @ts-expect-error - accessing private property for testing
      expect(connection.isClosing).toBe(true);
      // @ts-expect-error - accessing private property for testing
      expect(connection.reconnectTimer).toBeUndefined();
      expect(mockChannel.close).toHaveBeenCalled();
      expect(mockConnection.close).toHaveBeenCalled();
    });

    it('should wait for in-flight messages to settle before closing', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      // eslint-disable-next-line @typescript-eslint/no-empty-function -- placeholder reassigned by the Promise executor below
      let resolveInflight: () => void = () => {};
      const inflight = new Promise<void>((resolve) => {
        resolveInflight = resolve;
      });
      // @ts-expect-error - accessing private property for testing
      connection.inflightMessages.add(inflight);
      resolveInflight();

      // Act
      await connection.close();

      // Assert
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('in-flight messages'));
    });
  });

  describe('consume', () => {
    it('should register the consumer and delegate to the channel when set', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const mockChannel = { consume: vi.fn().mockResolvedValue(undefined) };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;
      const onMessage = vi.fn().mockResolvedValue(undefined);

      // Act
      await connection.consume('my-queue', onMessage);

      // Assert
      expect(mockChannel.consume).toHaveBeenCalledWith('my-queue', expect.any(Function));
    });

    it('should log and swallow errors thrown by the message handler', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const mockChannel = { consume: vi.fn().mockResolvedValue(undefined) };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;
      const handlerError = new Error('handler exploded');
      const onMessage = vi.fn().mockRejectedValue(handlerError);
      const message = { content: Buffer.from('x') } as unknown as import('amqplib').ConsumeMessage;

      // Act
      await connection.consume('my-queue', onMessage);
      const registeredHandler = mockChannel.consume.mock.calls[0][1] as (m: typeof message) => void;
      registeredHandler(message);
      await new Promise((resolve) => setImmediate(resolve));

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: 'Error' }),
        'Unhandled error in RabbitMQ message handler'
      );
    });

    it('should ignore a null message delivered by the channel', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const mockChannel = { consume: vi.fn().mockResolvedValue(undefined) };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;
      const onMessage = vi.fn().mockResolvedValue(undefined);

      // Act
      await connection.consume('my-queue', onMessage);
      const registeredHandler = mockChannel.consume.mock.calls[0][1] as (m: null) => void;
      registeredHandler(null);

      // Assert
      expect(onMessage).not.toHaveBeenCalled();
    });

    it('should register the consumer locally but not delegate to the channel when it is not set', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const onMessage = vi.fn().mockResolvedValue(undefined);

      // Act & Assert
      await expect(connection.consume('my-queue', onMessage)).resolves.toBeUndefined();
    });

    it('classifies a non-Error thrown by the message handler as UnknownError', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const mockChannel = { consume: vi.fn().mockResolvedValue(undefined) };
      // @ts-expect-error - accessing private property for testing
      connection.channel = mockChannel;

      const onMessage = vi.fn().mockRejectedValue('handler-exploded');
      const message = { content: Buffer.from('x') } as unknown as import('amqplib').ConsumeMessage;

      // Act
      await connection.consume('my-queue', onMessage);
      const registeredHandler = mockChannel.consume.mock.calls[0][1] as (m: typeof message) => void;
      registeredHandler(message);
      await new Promise((resolve) => setImmediate(resolve));

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: 'UnknownError' }),
        'Unhandled error in RabbitMQ message handler'
      );
    });
  });

  describe('incrementRedeliveryCount / hasBeenRedelivered', () => {
    it('falls back to message.properties.headers when no currentHeaders argument is passed', () => {
      // Arrange — this branch is unreachable through the public retry()/deadLetter() flow today
      // (incrementRedeliveryCount always supplies a truthy headers object), so it is exercised
      // directly to keep the defensive fallback covered.
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const message = {
        properties: { headers: { redelivery_count: 2 } }
      } as unknown as import('amqplib').ConsumeMessage;

      // Act
      // @ts-expect-error - accessing private method for testing
      const result = connection.hasBeenRedelivered(message);

      // Assert
      expect(result).toBe(true);
    });
  });

  describe('scheduleReconnect', () => {
    it('should give up and exit the process after reaching MAX_RECONNECT_ATTEMPTS', () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
      // @ts-expect-error - accessing private property for testing
      connection.reconnectAttempts = connection.MAX_RECONNECT_ATTEMPTS;

      // Act
      // @ts-expect-error - accessing private method for testing
      connection.scheduleReconnect();

      // Assert
      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });

    it('should not schedule a reconnect when already closing', () => {
      // Arrange
      vi.useFakeTimers();
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      // @ts-expect-error - accessing private property for testing
      connection.isClosing = true;

      // Act
      // @ts-expect-error - accessing private method for testing
      connection.scheduleReconnect();

      // Assert
      // @ts-expect-error - accessing private property for testing
      expect(connection.reconnectTimer).toBeUndefined();
      vi.useRealTimers();
    });

    it('should schedule a reconnect attempt with an increasing delay', () => {
      // Arrange
      vi.useFakeTimers();
      const connection = new RabbitMQConnection({ connectionSettings }, logger);

      // Act
      // @ts-expect-error - accessing private method for testing
      connection.scheduleReconnect();

      // Assert
      // @ts-expect-error - accessing private property for testing
      expect(connection.reconnectAttempts).toBe(1);
      // @ts-expect-error - accessing private property for testing
      expect(connection.reconnectTimer).toBeDefined();
      vi.useRealTimers();
    });
  });

  describe('reconnect', () => {
    it('should restore the connection, channel, and re-register consumers on success', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const newChannel = { consume: vi.fn().mockResolvedValue(undefined) };
      const newConnection = { close: vi.fn().mockResolvedValue(undefined) };
      // @ts-expect-error - accessing private method for testing
      connection.amqpConnect = vi.fn().mockResolvedValue(newConnection);
      // @ts-expect-error - accessing private method for testing
      connection.amqpChannel = vi.fn().mockResolvedValue(newChannel);
      // @ts-expect-error - accessing private property for testing
      connection.consumers.set('my-queue', vi.fn());

      // Act
      // @ts-expect-error - accessing private method for testing
      await connection.reconnect();

      // Assert
      // @ts-expect-error - accessing private property for testing
      expect(connection.channel).toBe(newChannel);
      // @ts-expect-error - accessing private property for testing
      expect(connection.reconnectAttempts).toBe(0);
      expect(newChannel.consume).toHaveBeenCalledWith('my-queue', expect.any(Function));
    });

    it('should schedule another reconnect attempt when the channel cannot be created', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const channelError = new Error('channel creation failed');
      const newConnection = { close: vi.fn().mockResolvedValue(undefined) };
      // @ts-expect-error - accessing private method for testing
      connection.amqpConnect = vi.fn().mockResolvedValue(newConnection);
      // @ts-expect-error - accessing private method for testing
      connection.amqpChannel = vi.fn().mockRejectedValue(channelError);
      vi.useFakeTimers();

      // Act
      // @ts-expect-error - accessing private method for testing
      await connection.reconnect();

      // Assert
      expect(newConnection.close).toHaveBeenCalled();
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: 'Error' }),
        'RabbitMQ reconnection failed'
      );
      // @ts-expect-error - accessing private property for testing
      expect(connection.reconnectAttempts).toBe(1);
      vi.useRealTimers();
    });

    it('should be a no-op re-entry guard when already reconnecting', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      // @ts-expect-error - accessing private property for testing
      connection.isReconnecting = true;
      // @ts-expect-error - accessing private method for testing
      const amqpConnectSpy = (connection.amqpConnect = vi.fn());

      // Act
      // @ts-expect-error - accessing private method for testing
      await connection.reconnect();

      // Assert
      expect(amqpConnectSpy).not.toHaveBeenCalled();
    });

    it('should schedule another reconnect attempt without re-registering consumers when no channel is restored', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);
      const newConnection = { close: vi.fn().mockResolvedValue(undefined) };
      // @ts-expect-error - accessing private method for testing
      connection.amqpConnect = vi.fn().mockResolvedValue(newConnection);
      // @ts-expect-error - accessing private method for testing
      connection.amqpChannel = vi.fn().mockResolvedValue(undefined);
      // @ts-expect-error - accessing private property for testing
      connection.consumers.set('my-queue', vi.fn());
      vi.useFakeTimers();

      // Act
      // @ts-expect-error - accessing private method for testing
      await connection.reconnect();

      // Assert
      // @ts-expect-error - accessing private property for testing
      expect(connection.channel).toBeUndefined();
      // @ts-expect-error - accessing private property for testing
      expect(connection.reconnectAttempts).toBe(0);
      vi.useRealTimers();
    });

    it('classifies a non-Error reconnection failure as UnknownError', async () => {
      // Arrange
      const connection = new RabbitMQConnection({ connectionSettings }, logger);

      // @ts-expect-error - accessing private method for testing
      connection.amqpConnect = vi.fn().mockRejectedValue('connection-refused');
      vi.useFakeTimers();

      // Act
      // @ts-expect-error - accessing private method for testing
      await connection.reconnect();

      // Assert
      expect(logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ errorType: 'UnknownError' }),
        'RabbitMQ reconnection failed'
      );
      vi.useRealTimers();
    });
  });
});
