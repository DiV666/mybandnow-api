export type VideoMetadata = {
  codec: string;
  durationInSeconds: number;
  width: number;
  height: number;
};

export interface VideoValidationService {
  validate(tempFilePath: string): Promise<VideoMetadata>;
}
