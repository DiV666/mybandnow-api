import { Index } from '../../../domain/database/Index.js';
import { Sort } from '../../../domain/database/Sort.js';
import { MongoIndexBuilder } from './MongoIndexBuilder.js';

export class MongoIndexConverter {
  private sortTransformers: Map<Sort, number>;

  constructor() {
    this.sortTransformers = new Map<Sort, number>([
      [Sort.ASC, 1],
      [Sort.DESC, -1],
      [Sort.NONE, 0]
    ]);
  }

  public convert(index: Index): MongoIndexBuilder {
    const indexBuilder = new MongoIndexBuilder();

    for (const key of index.keys) {
      indexBuilder.addKey(key.field, this.sortTransformers.get(key.sort) as number);
    }

    if (index.background) {
      indexBuilder.background(index.background);
    }
    if (index.name) {
      indexBuilder.name(index.name);
    }
    if (index.unique) {
      indexBuilder.unique(index.unique);
    }

    return indexBuilder;
  }
}
