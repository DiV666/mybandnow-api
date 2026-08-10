export interface BandMembershipGateway {
  addMember(bandId: string, authenticatedMusicianId: string, musicianId: string): Promise<void>;
}
