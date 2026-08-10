import { ObjectValueObject } from '@Contexts/Shared/domain/value-object/ObjectValueObject.js';

export class FfprobeLog extends ObjectValueObject {
  constructor(value: Record<string, unknown> | null) {
    const rawValue = value || {};
    super(rawValue);
  }
}
