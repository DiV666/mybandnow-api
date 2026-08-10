import { Query } from '@Contexts/Shared/domain/Query.js';

export class SearchInstrumentsQuery implements Query {
  constructor(readonly id: string) {}
}
