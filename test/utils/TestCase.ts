import { expect } from 'vitest';
import dot from 'dot-object';
import { mock, MockProxy } from 'vitest-mock-extended';
import Logger from '../../src/Contexts/Shared/domain/Logger.js';
import { Response } from '../../src/Contexts/Shared/domain/Response.js';
import { Query } from '../../src/Contexts/Shared/domain/Query.js';
import { QueryHandler } from '../../src/Contexts/Shared/domain/QueryHandler.js';
import { EventBus } from '../../src/Contexts/Shared/domain/EventBus.js';
import { DomainEvent } from '../../src/Contexts/Shared/domain/DomainEvent.js';
import { Mock } from './Mock.js';
import { Command } from '../../src/Contexts/Shared/domain/Command.js';
import { CommandHandler } from '../../src/Contexts/Shared/domain/CommandHandler.js';
import { Nullable } from '../../src/Contexts/Shared/domain/Nullable.js';

interface SimilarToOptions {
  exclude: Array<string>;
}

export class TestCase {
  private _logger: Nullable<MockProxy<Logger>> = null;
  private _eventBus: Nullable<MockProxy<EventBus>> = null;
  private eventBusMock: Mock = new Mock();

  async assertAskResponse(expected: Response, query: Query, handler: QueryHandler<Query, Response>) {
    const actual = await handler.handle(query);
    expect(actual).toStrictEqual(expected);
  }

  logger(): MockProxy<Logger> {
    if (!this._logger) {
      this._logger = mock<Logger>();
    }
    return this._logger;
  }

  eventBus(): MockProxy<EventBus> {
    if (!this._eventBus) {
      this._eventBus = mock<EventBus>();
    }
    return this._eventBus;
  }

  shouldPublishDomainEvent(domainEvent: DomainEvent, exclude: string[] = []) {
    const similarToDomainEvent = this.similarTo(domainEvent as unknown as Record<string, unknown>, {
      exclude: [...exclude, 'eventId', 'occurredOn']
    });

    this.eventBusMock.shouldReceive(this.eventBus().publish).once().withArgs([similarToDomainEvent]).andReturnNull();
  }
  assertPublishDomainEvent(event: unknown) {
    this.eventBusMock.expect(event);
  }

  async dispatch(command: Command, commandHandler: CommandHandler<Command>): Promise<void> {
    await commandHandler.handle(command);
  }

  similarTo<T extends Record<string, unknown>>(object: T, options?: SimilarToOptions): T {
    const proto = Object.getPrototypeOf(object);
    const newObject = Object.create(proto);
    Object.assign(newObject, object);

    if (options?.exclude) {
      for (const property of options.exclude) {
        const propertyExists = dot.pick(property, newObject) !== undefined && dot.pick(property, newObject) !== null;
        if (propertyExists) {
          dot.remove(property, newObject);
          dot.str(property, expect.anything(), newObject);
        }
      }
    }
    return newObject;
  }

  async assertThrows(
    func: () => Promise<unknown>,
    expectedException: (new (...args: unknown[]) => Error) | Error
  ): Promise<void> {
    await expect(func()).rejects.toThrow(expectedException as Error);
  }
}
