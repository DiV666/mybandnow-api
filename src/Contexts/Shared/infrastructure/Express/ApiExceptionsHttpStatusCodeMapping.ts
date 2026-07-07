import httpStatus from 'http-status';

export default class ApiExceptionsHttpStatusCodeMapping {
  private DEFAULT_STATUS_CODE = httpStatus.INTERNAL_SERVER_ERROR;
  private exceptions: Record<string, number> = {
    InvalidArgumentException: httpStatus.BAD_REQUEST,
    NotFoundHttpException: httpStatus.NOT_FOUND,
    UnauthorizedException: httpStatus.UNAUTHORIZED,
    ForbiddenException: httpStatus.FORBIDDEN
  };

  register(exceptionClass: string, statusCode: number): void {
    this.exceptions[exceptionClass] = statusCode;
  }

  statusCodeFor(exceptionClass: string): number {
    return exceptionClass in this.exceptions ? this.exceptions[exceptionClass] : this.DEFAULT_STATUS_CODE;
  }
}
