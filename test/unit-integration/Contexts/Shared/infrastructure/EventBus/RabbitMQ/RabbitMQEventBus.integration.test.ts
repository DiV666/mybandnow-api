import { describe, it, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { DomainEvent } from '../../../../../../../src/Contexts/Shared/domain/DomainEvent.js';
import { DomainEventSubscribers } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/DomainEventSubscribers.js';
import { RabbitMQConfigurer } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConfigurer.js';
import { RabbitMQConnection } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConnection.js';
import { RabbitMQConsumer } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQConsumer.js';
import { RabbitMQEventBus } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQEventBus.js';
import { RabbitMQQueueFormatter } from '../../../../../../../src/Contexts/Shared/infrastructure/EventBus/RabbitMQ/RabbitMQQueueFormatter.js';
import { DomainEventDummyMother } from '../../../../../../utils/mocks/DomainEventDummy.js';
import { DomainEventSubscriberDummy } from '../../../../../../utils/mocks/DomainEventSubscriberDummy.js';
import { RabbitMQConnectionMother } from './RabbitMQConnectionMother.js';
import Logger from '../../../../../../../src/Contexts/Shared/domain/Logger.js';
import { mock, MockProxy } from 'vitest-mock-extended';
import { SystemClock } from '../../../../../../../src/Contexts/Shared/infrastructure/Clock/SystemClock.js';

describe('RabbitMQEventBus integration test', () => {
  const exchange = 'test_domain_events';
  const logger: MockProxy<Logger> = mock<Logger>();
  const queueNameFormatter = new RabbitMQQueueFormatter('mybandnow');
  const clock = new SystemClock();

  let connection: RabbitMQConnection;
  let dummySubscriber: DomainEventSubscriberDummy;
  let configurer: RabbitMQConfigurer;
  let subscribers: DomainEventSubscribers;

  beforeAll(async () => {
    connection = await RabbitMQConnectionMother.create();
  });

  afterAll(async () => {
    await connection.close();
  });

  beforeEach(async () => {
    configurer = new RabbitMQConfigurer(connection, queueNameFormatter, 50);
    dummySubscriber = new DomainEventSubscriberDummy();
    subscribers = new DomainEventSubscribers([dummySubscriber]);
  });

  afterEach(async () => {
    await cleanEnvironment();
  });

  it('should consume the events published to RabbitMQ', { timeout: 30000 }, async () => {
    await configurer.configure({ exchange, subscribers: [dummySubscriber] });
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
    await eventBus.addSubscribers(subscribers);
    const event = DomainEventDummyMother.random();

    await eventBus.publish([event]);

    await dummySubscriber.assertConsumedEvents([event], 10000);
  });

  it('should retry failed domain events', { timeout: 30000 }, async () => {
    dummySubscriber = DomainEventSubscriberDummy.failsFirstTime();
    subscribers = new DomainEventSubscribers([dummySubscriber]);
    await configurer.configure({ exchange, subscribers: [dummySubscriber] });
    const eventBus = new RabbitMQEventBus({
      logger,
      connection,
      exchange,
      queueNameFormatter,
      maxRetries: 3,
      retryTtl: 500,
      clock,
      subscribers
    });
    await eventBus.addSubscribers(subscribers);
    const event = DomainEventDummyMother.random();

    await eventBus.publish([event]);

    await dummySubscriber.assertConsumedEvents([event], 10000);
  });

  it('it should send events to dead letter after retry failed', { timeout: 30000 }, async () => {
    dummySubscriber = DomainEventSubscriberDummy.alwaysFails();
    subscribers = new DomainEventSubscribers([dummySubscriber]);
    await configurer.configure({ exchange, subscribers: [dummySubscriber] });
    const eventBus = new RabbitMQEventBus({
      logger,
      connection,
      exchange,
      queueNameFormatter,
      maxRetries: 3,
      retryTtl: 1000,
      clock,
      subscribers
    });
    await eventBus.addSubscribers(subscribers);
    const event = DomainEventDummyMother.random();

    await eventBus.publish([event]);

    await dummySubscriber.assertConsumedEvents([], 3000);
    assertDeadLetter([event]);
  });

  async function cleanEnvironment() {
    await connection.deleteQueue(queueNameFormatter.format(dummySubscriber));
    await connection.deleteQueue(queueNameFormatter.formatRetry(dummySubscriber));
    await connection.deleteQueue(queueNameFormatter.formatDeadLetter(dummySubscriber));
  }

  async function assertDeadLetter(events: Array<DomainEvent>) {
    const deadLetterQueue = queueNameFormatter.formatDeadLetter(dummySubscriber);
    const deadLetterSubscriber = new DomainEventSubscriberDummy();
    const consumer = new RabbitMQConsumer({
      logger,
      subscriber: deadLetterSubscriber,
      connection,
      maxRetries: 3,
      queueName: deadLetterQueue,
      exchange,
      clock
    });
    await connection.consume(deadLetterQueue, consumer.onMessage.bind(consumer));

    await deadLetterSubscriber.assertConsumedEvents(events);
  }
});
