import { DomainEvent } from '../../../domain/DomainEvent.js';
import { EventBus } from '../../../domain/EventBus.js';
import Logger from '../../../domain/Logger.js';
import { DomainEventJsonSerializer } from '../DomainEventJsonSerializer.js';
import { DomainEventSubscribers } from '../DomainEventSubscribers.js';
import { EventBusCorrelationIdMetaEnricher } from '../EventBusCorrelationIdMetaEnricher.js';
import { RabbitMQConfigurer } from './RabbitMQConfigurer.js';
import { RabbitMQConnection } from './RabbitMQConnection.js';
import { RabbitMQConsumerFactory } from './RabbitMQConsumerFactory.js';
import { RabbitMQQueueFormatter } from './RabbitMQQueueFormatter.js';
import { Clock } from '../../../domain/Clock.js';

export class RabbitMQEventBus implements EventBus {
  private logger: Logger;
  private connection: RabbitMQConnection;
  private exchange: string;
  private queueNameFormatter: RabbitMQQueueFormatter;
  private maxRetries: number;
  private retryTtl: number;
  private clock: Clock;
  private subscribers: DomainEventSubscribers;

  constructor(params: {
    logger: Logger;
    connection: RabbitMQConnection;
    exchange: string;
    queueNameFormatter: RabbitMQQueueFormatter;
    maxRetries: number;
    retryTtl: number;
    clock: Clock;
    subscribers: DomainEventSubscribers;
  }) {
    const { logger, connection, exchange } = params;
    this.logger = logger;
    this.connection = connection;
    this.exchange = exchange;
    this.queueNameFormatter = params.queueNameFormatter;
    this.maxRetries = params.maxRetries;
    this.retryTtl = params.retryTtl;
    this.clock = params.clock;
    this.subscribers = params.subscribers;
  }

  async start(): Promise<void> {
    await this.connection.connect();

    const configurer = new RabbitMQConfigurer(this.connection, this.queueNameFormatter, this.retryTtl);

    await configurer.configure({ exchange: this.exchange, subscribers: this.subscribers.items });

    await this.addSubscribers(this.subscribers);
  }

  async stop(): Promise<void> {
    await this.connection.close();
  }

  async addSubscribers(subscribers: DomainEventSubscribers): Promise<void> {
    const consumerFactory = new RabbitMQConsumerFactory(this.logger, this.connection, this.maxRetries, this.clock);

    for (const subscriber of subscribers.items) {
      const queueName = this.queueNameFormatter.format(subscriber);
      const rabbitMQConsumer = consumerFactory.build(subscriber, this.exchange, queueName);

      await this.connection.consume(queueName, rabbitMQConsumer.onMessage.bind(rabbitMQConsumer));
    }
  }

  async publish(events: Array<DomainEvent>): Promise<void> {
    for (let event of events) {
      const routingKey = event.eventName;

      try {
        event = this.setMetaCorrelationId(event);
        const content = this.toBuffer(event);
        const options = this.options(event);

        await this.connection.publish({ exchange: this.exchange, routingKey, content, options });
        this.logger.debug(this.logContext(event, routingKey), 'domain_event.publish.rabbitmq.succeeded');
      } catch (error: unknown) {
        // Do not log full error — may contain PII from event data
        this.logger.error(
          {
            ...this.logContext(event, routingKey),
            errorType: error instanceof Error ? error.constructor.name : 'UnknownError'
          },
          'domain_event.publish.rabbitmq.failed'
        );

        // Rethrow so callers (e.g. OutboxEventBus) keep the event pending and own the retry.
        throw error;
      }
    }
  }

  private logContext(event: DomainEvent, routingKey: string): Record<string, string> {
    const context: Record<string, string> = {
      aggregateId: event.aggregateId,
      eventId: event.eventId,
      eventName: event.eventName,
      exchange: this.exchange,
      routingKey
    };
    const correlationId = this.extractCorrelationId(event);

    if (correlationId) {
      context.correlationId = correlationId;
    }

    return context;
  }

  private extractCorrelationId(event: DomainEvent): string | undefined {
    const correlationId = event.meta['x-correlation-id'];

    return typeof correlationId === 'string' ? correlationId : undefined;
  }

  private setMetaCorrelationId(event: DomainEvent): DomainEvent {
    return EventBusCorrelationIdMetaEnricher.enrich(event, { preserveImmutability: true });
  }

  private options(event: DomainEvent) {
    return {
      messageId: event.eventId,
      contentType: 'application/json',
      contentEncoding: 'utf-8'
    };
  }

  private toBuffer(event: DomainEvent): Buffer {
    const eventPrimitives = DomainEventJsonSerializer.serialize(event);

    return Buffer.from(eventPrimitives);
  }
}
