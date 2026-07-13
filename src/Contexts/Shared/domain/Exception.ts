export interface ExceptionAttrs {
  code?: string;
  message: string;
  details?: unknown;
}

export interface ExceptionOptions {
  code?: string;
  message: string;
  details?: unknown;
  publicMessage?: string;
}

export class Exception extends Error {
  readonly code?: string;
  readonly details?: unknown;
  readonly publicMessage?: string;

  constructor(ex: ExceptionOptions) {
    super(ex.message);
    this.code = ex.code ?? '00000';
    this.details = ex.details;
    this.publicMessage = ex.publicMessage;
  }

  toJSON(): ExceptionAttrs {
    return {
      code: this.code,
      message: this.message,
      details: this.details
    };
  }
}
