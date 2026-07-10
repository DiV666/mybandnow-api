import { BandMemberId } from './value-object/BandMemberId.js';
import { MusicianId } from '../../Musician/domain/value-object/MusicianId.js';
import { BandMemberRole, BandMemberRoleType } from './value-object/BandMemberRole.js';

export type BandMemberPrimitives = {
  id: string;
  musicianId: string;
  role: BandMemberRoleType;
};

export class BandMember {
  constructor(
    readonly id: BandMemberId,
    readonly musicianId: MusicianId,
    readonly role: BandMemberRole
  ) {}

  static fromPrimitives(plainData: BandMemberPrimitives): BandMember {
    return new BandMember(
      new BandMemberId(plainData.id),
      new MusicianId(plainData.musicianId),
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
