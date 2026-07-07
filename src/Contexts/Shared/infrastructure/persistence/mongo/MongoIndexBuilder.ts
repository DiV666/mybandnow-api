export interface MongoIndexBuilderPrimitives {
  key: Record<string, number>;
  options: Record<string, unknown>;
}
export class MongoIndexBuilder {
  private key: Record<string, number> = {};
  private options: Record<string, unknown> = {};

  getIndex(): MongoIndexBuilderPrimitives {
    return {
      key: this.key,
      options: this.options
    };
  }

  addKey(field: string, sort: number): void {
    this.key[field] = sort;
  }

  background(value: boolean): void {
    this.options.background = value;
  }

  name(value: string): void {
    this.options.name = value;
  }

  unique(value: boolean): void {
    this.options.unique = value;
  }
}
