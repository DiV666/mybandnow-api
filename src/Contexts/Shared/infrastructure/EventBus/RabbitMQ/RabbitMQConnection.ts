import amqplib, { ConsumeMessage } from 'amqplib';
import { ConnectionSettings } from './ConnectionSettings.js';
import { RabbitMQExchangeNameFormatter } from './RabbitMQExchangeNameFormatter.js';
import Logger from '../../../domain/Logger.js';
import healthStatus from '../../health.js';

export class RabbitMQConnection {
  private connectionSettings: ConnectionSettings;
  private channel?: amqplib.ConfirmChannel;
  private connection?: amqplib.ChannelModel;
  private logger: Logger;
  private isReconnecting = false;
  private isClosing = false;
  private reconnectAttempts = 0;
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private readonly consumers = new Map<string, (message: ConsumeMessage | null) => void>();
  private readonly RECONNECT_DELAYS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000];
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly inflightMessages = new Set<Promise<void>>();

  constructor(params: { connectionSettings: ConnectionSettings }, logger: Logger) {
    this.connectionSettings = params.connectionSettings;
    this.logger = logger;
  }

  async connect() {
    this.connection = await this.amqpConnect();
    this.channel = await this.amqpChannel();
  }

  async exchange(params: { name: string }) {
    return await this.channel?.assertExchange(params.name, 'topic', { durable: true });
  }

  async queue(params: {
    exchange: string;
    name: string;
    routingKeys: string[];
    deadLetterExchange?: string;
    deadLetterQueue?: string;
    messageTtl?: number;
  }) {
    const durable = true;
    const exclusive = false;
    const autoDelete = false;
    const args = this.getQueueArguments(params);

    await this.channel?.assertQueue(params.name, {
      exclusive,
      durable,
      autoDelete,
      arguments: args
    });
    if (this.channel) {
      for (const routingKey of params.routingKeys) {
        await this.channel.bindQueue(params.name, params.exchange, routingKey);
      }
    }
  }

  private getQueueArguments(params: {
    exchange: string;
    name: string;
    routingKeys: string[];
    deadLetterExchange?: string;
    deadLetterQueue?: string;
    messageTtl?: number;
  }) {
    let args: Record<string, unknown> = {};
    if (params.deadLetterExchange) {
      args = { ...args, 'x-dead-letter-exchange': params.deadLetterExchange };
    }
    if (params.deadLetterQueue) {
      args = { ...args, 'x-dead-letter-routing-key': params.deadLetterQueue };
    }
    if (params.messageTtl) {
      args = { ...args, 'x-message-ttl': params.messageTtl };
    }

    return args;
  }

  async deleteQueue(queue: string) {
    if (this.channel) {
      return await this.channel.deleteQueue(queue);
    }
  }

  private async amqpConnect() {
    const { hostname, port, secure } = this.connectionSettings.connection;
    const { username, password, vhost } = this.connectionSettings;
    const protocol = secure ? 'amqps' : 'amqp';

    const connection = await amqplib.connect({
      protocol,
      hostname,
      port,
      username,
      password,
      vhost
    });

    connection.on('error', (err: Error) => {
      this.logger.error({ errorType: err.constructor.name }, 'RabbitMQ connection error');
      healthStatus.setRabbitHealth('KO');
    });
    connection.on('close', () => {
      if (!this.isClosing) {
        healthStatus.setRabbitHealth('KO');
        void this.reconnect();
      }
    });

    return connection;
  }

  private async reconnect(): Promise<void> {
    if (this.isReconnecting) return;
    this.isReconnecting = true;
    try {
      const newConnection = await this.amqpConnect();
      let newChannel: amqplib.ConfirmChannel | undefined;
      try {
        newChannel = await this.amqpChannel(newConnection);
      } catch (channelError) {
        await newConnection.close().catch(() => {
          // Ignore close errors during cleanup
        });
        throw channelError;
      }
      this.connection = newConnection;
      this.channel = newChannel;
      healthStatus.setRabbitHealth('OK');
      this.reconnectAttempts = 0;
      const channel = this.channel;
      if (channel) {
        for (const [queue, handler] of this.consumers) {
          await channel.consume(queue, handler);
        }
      }
    } catch (error) {
      this.logger.error(
        { errorType: error instanceof Error ? error.constructor.name : 'UnknownError' },
        'RabbitMQ reconnection failed'
      );
      this.scheduleReconnect();
    } finally {
      this.isReconnecting = false;
    }
  }

  private scheduleReconnect(): void {
    if (this.isClosing) return;

    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.error(
        `RabbitMQ: giving up after ${this.MAX_RECONNECT_ATTEMPTS} reconnect attempts — exiting process`
      );
      process.exit(1);
      return;
    }

    const delay = this.RECONNECT_DELAYS[Math.min(this.reconnectAttempts, this.RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempts++;
    this.logger.warn(
      `RabbitMQ: scheduling reconnect attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} in ${delay}ms`
    );
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = undefined;
      void this.reconnect();
    }, delay);
  }

  private async amqpChannel(connection?: amqplib.ChannelModel): Promise<amqplib.ConfirmChannel | undefined> {
    const conn = connection ?? this.connection;
    if (conn) {
      const channel = await conn.createConfirmChannel();
      await channel.prefetch(1);
      return channel;
    }
  }

  async publish(params: {
    exchange: string;
    routingKey: string;
    content: Buffer;
    options: {
      messageId: string;
      contentType: string;
      contentEncoding: string;
      priority?: number;
      headers?: Record<string, unknown>;
    };
  }) {
    const { routingKey, content, options, exchange } = params;

    return new Promise((resolve, reject) => {
      if (this.channel) {
        this.channel.publish(exchange, routingKey, content, options, (error: Error | null) =>
          error ? reject(error) : resolve(null)
        );
      } else {
        reject(new Error('Channel not initialized'));
      }
    });
  }

  async close() {
    this.isClosing = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
    // Wait for all in-flight messages to complete before closing
    if (this.inflightMessages.size > 0) {
      this.logger.info(`Waiting for ${this.inflightMessages.size} in-flight messages to complete...`);
      await Promise.allSettled(Array.from(this.inflightMessages));
    }
    this.consumers.clear();
    await this.channel?.close();
    return await this.connection?.close();
  }

  async consume(queue: string, onMessage: (message: ConsumeMessage) => Promise<void>): Promise<void> {
    const handler = (message: ConsumeMessage | null) => {
      if (!message) return;
      // CRITICAL FIX: Track in-flight promises and await them before closing
      const promise = onMessage(message)
        .catch((err) => {
          this.logger.error(
            { errorType: err instanceof Error ? err.constructor.name : 'UnknownError' },
            'Unhandled error in RabbitMQ message handler'
          );
        })
        .finally(() => {
          this.inflightMessages.delete(promise);
        });
      this.inflightMessages.add(promise);
    };
    this.consumers.set(queue, handler);
    if (this.channel) {
      await this.channel.consume(queue, handler);
    }
  }

  ack(message: ConsumeMessage) {
    if (this.channel) {
      this.channel.ack(message);
    }
  }

  nack(message: ConsumeMessage, allUpTo = false, requeue = true) {
    if (this.channel) {
      this.channel.nack(message, allUpTo, requeue);
    }
  }

  async retry(message: ConsumeMessage, queue: string, exchange: string) {
    const retryExchange = RabbitMQExchangeNameFormatter.retry(exchange);
    const options = this.getMessageOptions(message);

    return await this.publish({ exchange: retryExchange, routingKey: queue, content: message.content, options });
  }

  async deadLetter(message: ConsumeMessage, queue: string, exchange: string) {
    const deadLetterExchange = RabbitMQExchangeNameFormatter.deadLetter(exchange);
    const options = this.getMessageOptions(message);

    return await this.publish({
      exchange: deadLetterExchange,
      routingKey: queue,
      content: message.content,
      options
    });
  }

  private getMessageOptions(message: ConsumeMessage) {
    const { messageId, contentType, contentEncoding, priority } = message.properties;
    const options = {
      messageId,
      headers: this.incrementRedeliveryCount(message),
      contentType,
      contentEncoding,
      priority
    };
    return options;
  }

  private incrementRedeliveryCount(message: ConsumeMessage): Record<string, unknown> {
    const headers: Record<string, unknown> = message.properties.headers ? { ...message.properties.headers } : {};

    if (this.hasBeenRedelivered(message, headers)) {
      const count = parseInt(String(headers['redelivery_count']));
      headers['redelivery_count'] = count + 1;
    } else {
      headers['redelivery_count'] = 1;
    }

    return headers;
  }

  private hasBeenRedelivered(message: ConsumeMessage, currentHeaders?: Record<string, unknown>): boolean {
    const headersToCheck = currentHeaders || message.properties.headers;
    return Boolean(headersToCheck && typeof headersToCheck['redelivery_count'] !== 'undefined');
  }
}
