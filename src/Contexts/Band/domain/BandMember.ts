import { BandMemberId } from './value-object/BandMemberId.js';
import { BandMemberMusicianId } from './value-object/BandMemberMusicianId.js';
import { BandMemberRole, BandMemberRoleType } from './value-object/BandMemberRole.js';

export type BandMemberPrimitives = {
  id: string;
  musicianId: string;
  role: BandMemberRoleType;
};

export class BandMember {
  constructor(
    readonly id: BandMemberId,
    readonly musicianId: BandMemberMusicianId,
    readonly role: BandMemberRole
  ) {}

  static fromPrimitives(plainData: BandMemberPrimitives): BandMember {
    return new BandMember(
      new BandMemberId(plainData.id),
      new BandMemberMusicianId(plainData.musicianId),
      new BandMemberRole(plainData.role as BandMemberRoleType)
    );
  }

  toPrimitives(): BandMemberPrimitives {
    return {
      id: this.id.value,
      musicianId: this.musicianId.value,
      role: this.role.value
    };
  }
}
