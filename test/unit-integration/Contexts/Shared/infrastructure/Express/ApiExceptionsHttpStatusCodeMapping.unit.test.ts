import { describe, it, expect, beforeEach } from 'vitest';
import ApiExceptionsHttpStatusCodeMapping from '../../../../../../src/Contexts/Shared/infrastructure/Express/ApiExceptionsHttpStatusCodeMapping.js';
import httpStatus from 'http-status';

describe('ApiExceptionsHttpStatusCodeMapping', () => {
  let mapping: ApiExceptionsHttpStatusCodeMapping;

  beforeEach(() => {
    mapping = new ApiExceptionsHttpStatusCodeMapping();
  });

  it('returns 400 for InvalidArgumentException by default', () => {
    expect(mapping.statusCodeFor('InvalidArgumentException')).toBe(httpStatus.BAD_REQUEST);
  });

  it('returns 404 for NotFoundHttpException by default', () => {
    expect(mapping.statusCodeFor('NotFoundHttpException')).toBe(httpStatus.NOT_FOUND);
  });

  it('returns 401 for UnauthorizedException by default', () => {
    expect(mapping.statusCodeFor('UnauthorizedException')).toBe(httpStatus.UNAUTHORIZED);
  });

  it('returns 403 for ForbiddenException by default', () => {
    expect(mapping.statusCodeFor('ForbiddenException')).toBe(httpStatus.FORBIDDEN);
  });

  it('returns 500 for unknown exception class', () => {
    expect(mapping.statusCodeFor('SomeRandomException')).toBe(httpStatus.INTERNAL_SERVER_ERROR);
  });

  it('registers a custom exception and returns its status code', () => {
    // Arrange
    mapping.register('CustomException', httpStatus.CONFLICT);

    // Act & Assert
    expect(mapping.statusCodeFor('CustomException')).toBe(httpStatus.CONFLICT);
  });

  it('overwrites an existing mapping when registered again', () => {
    mapping.register('InvalidArgumentException', httpStatus.UNPROCESSABLE_ENTITY);
    expect(mapping.statusCodeFor('InvalidArgumentException')).toBe(httpStatus.UNPROCESSABLE_ENTITY);
  });
});
