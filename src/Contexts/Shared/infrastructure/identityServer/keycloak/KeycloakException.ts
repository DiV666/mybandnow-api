import { Exception } from '../../../domain/Exception.js';

export class KeycloakException extends Exception {
  constructor(ex: { code?: string; message?: unknown; details?: unknown }) {
    super({
      code: ex.code || '00000',
      message: `Keycloak library has thrown an exception: See details.`,
      details: ex.details
    });
  }
}
