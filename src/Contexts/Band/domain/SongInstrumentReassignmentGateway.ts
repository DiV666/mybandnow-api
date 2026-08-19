export interface SongInstrumentReassignmentGateway {
  reassignBandMemberInstruments(bandId: string, previousMusicianId: string, newMusicianId: string): Promise<void>;
}
