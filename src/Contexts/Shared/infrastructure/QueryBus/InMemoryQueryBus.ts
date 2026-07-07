import { Query } from '../../domain/Query.js';
import { Response } from '../../domain/Response.js';
import { QueryBus } from './../../domain/QueryBus.js';
import { QueryHandlersInformation } from './QueryHandlersInformation.js';

export class InMemoryQueryBus implements QueryBus {
  constructor(private queryHandlersInformation: QueryHandlersInformation) {}

  async ask<R extends Response>(query: Query): Promise<R> {
    const handler = this.queryHandlersInformation.search(query);

    return handler.handle(query) as Promise<R>;
  }
}
