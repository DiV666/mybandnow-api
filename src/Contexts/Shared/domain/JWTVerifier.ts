/**
 * JWT verification interface - allows Apps layer to verify tokens
 * without depending on a specific Infrastructure layer implementation.
 * Domain-level abstraction: receives token as string instead of framework-specific Request object
 */
export interface JWTVerifier {
  verifyJWT(token: string, scopes: string[]): Promise<unknown>;
}
