import { describe, it, expect, vi } from 'vitest';
import { InMemoryQueryBus } from '../../../../../../src/Contexts/Shared/infrastructure/QueryBus/InMemoryQueryBus.js';
import { QueryHandlersInformation } from '../../../../../../src/Contexts/Shared/infrastructure/QueryBus/QueryHandlersInformation.js';
import { Query } from '../../../../../../src/Contexts/Shared/domain/Query.js';
import { QueryHandler } from '../../../../../../src/Contexts/Shared/domain/QueryHandler.js';
import { Response } from '../../../../../../src/Contexts/Shared/domain/Response.js';
import { QueryNotRegisteredError } from '../../../../../../src/Contexts/Shared/domain/QueryNotRegisteredError.js';

// Test fixtures
class TestQuery extends Query {
  constructor(readonly id: string) {
    super();
  }
}

interface TestResponse extends Response {
  data: string;
}

class TestQueryHandler implements QueryHandler<TestQuery, TestResponse> {
  public lastQuery: TestQuery | null = null;

  subscribedTo(): typeof TestQuery {
    return TestQuery;
  }

  async handle(query: TestQuery): Promise<TestResponse> {
    this.lastQuery = query;
    return { data: `result-${query.id}` };
  }
}

describe('QueryHandlersInformation', () => {
  it('finds the registered handler for a query', () => {
    // Arrange
    const handler = new TestQueryHandler();
    const info = new QueryHandlersInformation([handler]);
    const query = new TestQuery('123');

    // Act
    const found = info.search(query);

    // Assert
    expect(found).toBe(handler);
  });

  it('throws QueryNotRegisteredError when no handler is registered', () => {
    const info = new QueryHandlersInformation([]);
    const query = new TestQuery('123');
    expect(() => info.search(query)).toThrow(QueryNotRegisteredError);
  });

  it('throws with the query class name in the error message', () => {
    const info = new QueryHandlersInformation([]);
    expect(() => info.search(new TestQuery('x'))).toThrow('TestQuery');
  });
});

describe('InMemoryQueryBus', () => {
  it('asks the registered handler and returns the response', async () => {
    // Arrange
    const handler = new TestQueryHandler();
    const info = new QueryHandlersInformation([handler]);
    const bus = new InMemoryQueryBus(info);
    const query = new TestQuery('42');

    // Act
    const result = await bus.ask<TestResponse>(query);

    // Assert
    expect(result.data).toBe('result-42');
    expect(handler.lastQuery).toBe(query);
  });

  it('propagates errors thrown by the handler', async () => {
    const handler = new TestQueryHandler();
    handler.handle = vi.fn().mockRejectedValue(new Error('query failed'));
    const info = new QueryHandlersInformation([handler]);
    const bus = new InMemoryQueryBus(info);

    await expect(bus.ask(new TestQuery('x'))).rejects.toThrow('query failed');
  });

  it('throws QueryNotRegisteredError for unregistered query', async () => {
    const info = new QueryHandlersInformation([]);
    const bus = new InMemoryQueryBus(info);
    await expect(bus.ask(new TestQuery('x'))).rejects.toThrow(QueryNotRegisteredError);
  });
});
