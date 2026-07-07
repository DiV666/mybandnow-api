export function removeUndefinedValuesFromObjects(values: Record<string, unknown>): Record<string, unknown> {
  const definedNewValues = Object.keys(values).reduce<Record<string, unknown>>((acc, key) => {
    const value = values[key];
    if (value !== undefined) {
      acc[key] = value;
    }
    return acc;
  }, {});

  return definedNewValues;
}
