import { expect } from 'vitest';
import { DomainEvent } from '@Contexts/Shared/domain/DomainEvent.js';
import { Exception } from '@Contexts/Shared/domain/Exception.js';
import { DomainEventJsonSerializer } from '@Contexts/Shared/infrastructure/EventBus/DomainEventJsonSerializer.js';
import { DomainEventSubscriber } from '@Contexts/Shared/infrastructure/EventBus/DomainEventSubscriber.js';

export class DomainEventSubscriberDummy implements DomainEventSubscriber {
  static failsFirstTime() {
    return new DomainEventSubscriberDummy({ failsFirstTime: true });
  }

  static alwaysFails() {
    return new DomainEventSubscriberDummy({ alwaysFails: true });
  }

  module = 'dummy';
  private events: Array<DomainEvent>;
  private failsFirstTime = false;
  private alwaysFails = false;
  private alreadyFailed = false;

  constructor(params?: { failsFirstTime?: boolean; alwaysFails?: boolean }) {
    if (params?.failsFirstTime) {
      this.failsFirstTime = true;
    }
    if (params?.alwaysFails) {
      this.alwaysFails = true;
    }

    this.events = [];
  }

  subscribedTo(): string[] {
    return ['dummy:event'];
  }

  async on(domainEvent: DomainEvent): Promise<void> {
    if (this.alwaysFails) {
      throw new Error();
    }

    if (!this.alreadyFailed && this.failsFirstTime) {
      this.alreadyFailed = true;
      throw new Error();
    }

    this.events.push(domainEvent);
  }

  handlerException(ex: Exception): void {
    throw ex;
  }

  async assertConsumedEvents(events: Array<DomainEvent>, timeout = 400) {
    const serializedEvents = events.map((event) => JSON.parse(DomainEventJsonSerializer.serialize(event)).data);

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const consumedEvents = this.events.map(
            (event) => JSON.parse(DomainEventJsonSerializer.serialize(event)).data
          );

          expect(this.events.length).toEqual(events.length);
          expect(consumedEvents).toEqual(serializedEvents);
          resolve(true);
        } catch (error: unknown) {
          reject(error);
        }
      }, timeout);
    });
  }
}
