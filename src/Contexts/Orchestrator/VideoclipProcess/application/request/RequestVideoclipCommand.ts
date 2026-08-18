import { Command } from '@Contexts/Shared/domain/Command.js';

export type RequestVideoclipCommandInstrument = {
  songInstrumentId: string;
  videoUrl: string | null;
  instrumentName: string;
  startTimeMs: number;
};

export class RequestVideoclipCommand extends Command {
  constructor(
    readonly id: string,
    readonly songId: string,
    readonly originalVideoclipUrl: string,
    readonly instruments: Array<RequestVideoclipCommandInstrument>
  ) {
    super();
  }
}
