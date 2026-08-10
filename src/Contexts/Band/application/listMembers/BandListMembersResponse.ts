import { Response } from '@Contexts/Shared/domain/Response.js';
import { BandMemberRoleType } from '../../domain/value-object/BandMemberRole.js';

export interface BandListMembersItemResponse {
  musicianId: string;
  role: BandMemberRoleType;
}

export class BandListMembersResponse implements Response {
  constructor(private readonly items: Array<BandListMembersItemResponse>) {}

  toPrimitives(): { items: Array<BandListMembersItemResponse>; total: number } {
    return {
      items: this.items,
      total: this.items.length
    };
  }
}
