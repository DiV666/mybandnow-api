import { Response } from '@Contexts/Shared/domain/Response.js';

export class LoginUserResponse implements Response {
  constructor(readonly accessToken: string) {}
}
