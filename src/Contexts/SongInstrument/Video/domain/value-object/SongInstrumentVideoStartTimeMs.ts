import { NumberValueObject } from '@Contexts/Shared/domain/value-object/NumberValueObject.js';

// Negative values are allowed: startTimeMs models the clip position inside the
// global composition timeline, and a clip can start before that timeline's origin.
export class SongInstrumentVideoStartTimeMs extends NumberValueObject {}
