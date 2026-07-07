import { describe, it, expect } from 'vitest';
import { MongoIndexBuilder } from '../../../../../../../src/Contexts/Shared/infrastructure/persistence/mongo/MongoIndexBuilder.js';
import { MongoIndexConverter } from '../../../../../../../src/Contexts/Shared/infrastructure/persistence/mongo/MongoIndexConverter.js';
import { Index } from '../../../../../../../src/Contexts/Shared/domain/database/Index.js';
import { Sort } from '../../../../../../../src/Contexts/Shared/domain/database/Sort.js';

describe('MongoIndexBuilder', () => {
  it('returns an empty index by default', () => {
    // Arrange & Act
    const builder = new MongoIndexBuilder();

    // Assert
    expect(builder.getIndex()).toEqual({ key: {}, options: {} });
  });

  it('adds a key with sort direction', () => {
    const builder = new MongoIndexBuilder();
    builder.addKey('name', 1);
    expect(builder.getIndex().key).toEqual({ name: 1 });
  });

  it('adds multiple keys', () => {
    const builder = new MongoIndexBuilder();
    builder.addKey('firstName', 1);
    builder.addKey('lastName', -1);
    expect(builder.getIndex().key).toEqual({ firstName: 1, lastName: -1 });
  });

  it('sets background option', () => {
    const builder = new MongoIndexBuilder();
    builder.background(true);
    expect(builder.getIndex().options.background).toBe(true);
  });

  it('sets name option', () => {
    const builder = new MongoIndexBuilder();
    builder.name('idx_name');
    expect(builder.getIndex().options.name).toBe('idx_name');
  });

  it('sets unique option', () => {
    const builder = new MongoIndexBuilder();
    builder.unique(true);
    expect(builder.getIndex().options.unique).toBe(true);
  });

  it('supports all options simultaneously', () => {
    const builder = new MongoIndexBuilder();
    builder.addKey('email', 1);
    builder.background(true);
    builder.name('idx_email_unique');
    builder.unique(true);

    const index = builder.getIndex();
    expect(index.key).toEqual({ email: 1 });
    expect(index.options).toEqual({ background: true, name: 'idx_email_unique', unique: true });
  });
});

describe('MongoIndexConverter', () => {
  it('converts a simple ASC index', () => {
    // Arrange
    const index: Index = {
      keys: [{ field: 'name', sort: Sort.ASC }]
    };
    const converter = new MongoIndexConverter();

    // Act
    const builder = converter.convert(index);

    // Assert
    expect(builder.getIndex().key).toEqual({ name: 1 });
  });

  it('converts a DESC sort', () => {
    const index: Index = { keys: [{ field: 'createdAt', sort: Sort.DESC }] };
    const converter = new MongoIndexConverter();
    const builder = converter.convert(index);
    expect(builder.getIndex().key).toEqual({ createdAt: -1 });
  });

  it('converts NONE sort to 0', () => {
    const index: Index = { keys: [{ field: 'meta', sort: Sort.NONE }] };
    const converter = new MongoIndexConverter();
    const builder = converter.convert(index);
    expect(builder.getIndex().key).toEqual({ meta: 0 });
  });

  it('converts compound indexes', () => {
    const index: Index = {
      keys: [
        { field: 'firstName', sort: Sort.ASC },
        { field: 'lastName', sort: Sort.ASC }
      ]
    };
    const converter = new MongoIndexConverter();
    const builder = converter.convert(index);
    expect(builder.getIndex().key).toEqual({ firstName: 1, lastName: 1 });
  });

  it('sets background when specified', () => {
    const index: Index = { keys: [{ field: 'name', sort: Sort.ASC }], background: true };
    const converter = new MongoIndexConverter();
    const builder = converter.convert(index);
    expect(builder.getIndex().options.background).toBe(true);
  });

  it('sets name when specified', () => {
    const index: Index = { keys: [{ field: 'email', sort: Sort.ASC }], name: 'idx_email' };
    const converter = new MongoIndexConverter();
    const builder = converter.convert(index);
    expect(builder.getIndex().options.name).toBe('idx_email');
  });

  it('sets unique when specified', () => {
    const index: Index = { keys: [{ field: 'email', sort: Sort.ASC }], unique: true };
    const converter = new MongoIndexConverter();
    const builder = converter.convert(index);
    expect(builder.getIndex().options.unique).toBe(true);
  });

  it('does not set options when they are absent', () => {
    const index: Index = { keys: [{ field: 'name', sort: Sort.ASC }] };
    const converter = new MongoIndexConverter();
    const builder = converter.convert(index);
    expect(builder.getIndex().options).toEqual({});
  });
});
