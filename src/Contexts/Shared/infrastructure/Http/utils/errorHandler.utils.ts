import type { AxiosError } from 'axios';

export interface ExceptionOptions {
  code?: string;
  message: unknown;
  details: unknown;
}
export type ExceptionConstructor = new (options: ExceptionOptions) => Error;

export function createAndThrowHttpException(
  error: AxiosError,
  errorMap: Record<number, string>,
  ExceptionClass: ExceptionConstructor
): never {
  if (error.response) {
    const status = error.response.status;
    const code = errorMap[status];

    throw new ExceptionClass({
      ...(code && { code }),
      message: error,
      details: error.response.data
    });
  }

  throw new ExceptionClass({
    message: error,
    details: error.cause
  });
}
