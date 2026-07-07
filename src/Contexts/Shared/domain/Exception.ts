export interface ExceptionAttrs {
  code?: string;
  message: string;
  details?: unknown;
}
export class Exception extends Error {
  readonly code?: string;
  readonly details?: unknown;

  constructor(ex: { code?: string; message: string; details?: unknown }) {
    super(ex.message);
    this.code = ex.code ?? '00000';
    this.details = ex.details;
  }

  toJSON(): ExceptionAttrs {
    return {
      code: this.code,
      message: this.message,
      details: this.details
    };
  }
}
