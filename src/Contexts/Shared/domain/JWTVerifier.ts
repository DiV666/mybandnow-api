/**
 * JWT verification interface - allows Apps layer to verify tokens
 * without depending on Infrastructure layer implementation (Keycloak)
 *
 * Domain-level abstraction: receives token as string instead of framework-specific Request object
 */
export interface JWTVerifier {
  verifyJWT(token: string, scopes: string[]): Promise<unknown>;
}
