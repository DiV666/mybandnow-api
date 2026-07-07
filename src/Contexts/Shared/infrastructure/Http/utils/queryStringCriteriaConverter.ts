import QueryString from 'qs';
import { Filters, type FilterValueType } from '../../../domain/criteria/Filters.js';
import { InvalidArgumentException } from '../../../domain/exceptions/InvalidArgumentException.js';

function isFilterValue(value: unknown): value is FilterValueType {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    (Array.isArray(value) &&
      value.every((v) => typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'))
  );
}

function isFilterMetadata(value: unknown): value is string {
  return typeof value === 'string';
}

function toFilterRecord(filter: Record<string, unknown>): Record<string, FilterValueType> {
  const value = filter.value;
  const field = filter.field;
  const operator = filter.operator;
  const type = filter.type;

  if (!isFilterMetadata(field) || !isFilterMetadata(operator) || !isFilterMetadata(type)) {
    throw new InvalidArgumentException({ message: 'Invalid filter metadata type' });
  }

  if (!isFilterValue(value)) {
    throw new InvalidArgumentException({ message: 'Invalid filter value type' });
  }

  return {
    field,
    operator,
    value,
    type
  };
}

function parseFilterElement(element: string): Array<Record<string, unknown>> {
  // Express/qs already decodes query values, so try parsing the raw value first.
  // Fall back to decoding for callers that still pass URL-encoded JSON.
  let parsed: unknown;
  try {
    parsed = JSON.parse(element);
  } catch {
    parsed = JSON.parse(decodeURIComponent(element));
  }
  return Array.isArray(parsed) ? parsed : [parsed as Record<string, unknown>];
}

export function queryStringToFilters(
  filters:
    | string
    | Array<string>
    | QueryString.ParsedQs
    | Array<QueryString.ParsedQs>
    | Array<Record<string, unknown>>
    | undefined
): Filters {
  if (!filters) {
    return Filters.none();
  }

  // Normalize the common single-occurrence query param shape (?filters=<json>) into an array
  const normalized = typeof filters === 'string' ? [filters] : filters;

  try {
    if (Array.isArray(normalized) && normalized.length > 0 && normalized.every((el) => typeof el === 'string')) {
      const filtersArray = normalized.flatMap(parseFilterElement);
      const mappedFilters = filtersArray.map(toFilterRecord);
      return Filters.fromValues(mappedFilters);
    }
  } catch (ex: unknown) {
    const message = ex instanceof Error ? ex.message : String(ex);
    throw new InvalidArgumentException({
      message: `The filter could not be parsed: ${message}`
    });
  }

  // Ensure filters is an array before mapping
  if (!Array.isArray(normalized)) {
    throw new InvalidArgumentException({ message: 'Filters must be an array' });
  }

  const mappedFilters = (normalized as Array<Record<string, unknown>>).map(toFilterRecord);
  return Filters.fromValues(mappedFilters);
}
