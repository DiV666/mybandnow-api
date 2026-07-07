/**
 * Sentinel thrown by a security handler when the client did not present
 * credentials for a given security scheme. It is NOT an authentication
 * failure: it means the scheme was never attempted, so the central
 * unauthorized handler can ignore it when another scheme was attempted.
 */
export class CredentialsNotProvidedException extends Error {
  constructor(public readonly scheme: string) {
    super(`No credentials provided for security scheme <${scheme}>.`);
    this.name = 'CredentialsNotProvidedException';
  }
}
