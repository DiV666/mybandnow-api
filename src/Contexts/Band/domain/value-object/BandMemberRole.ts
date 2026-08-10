export const BandMemberRoleValues = {
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  PLAYING_COACH: 'PLAYING_COACH'
} as const;

export type BandMemberRoleType = (typeof BandMemberRoleValues)[keyof typeof BandMemberRoleValues];

import { EnumValueObject } from '@Contexts/Shared/domain/value-object/EnumValueObject.js';
import { InvalidArgumentException } from '@Contexts/Shared/domain/exceptions/InvalidArgumentException.js';

export class BandMemberRole extends EnumValueObject<BandMemberRoleType> {
  constructor(value: BandMemberRoleType) {
    super(value, Object.values(BandMemberRoleValues));
  }

  protected throwErrorForInvalidValue(value: BandMemberRoleType): void {
    throw new InvalidArgumentException({
      message: `<BandMemberRole> does not allow the value <${value}>`
    });
  }
}
