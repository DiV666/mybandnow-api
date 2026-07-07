import { ContainerBuilder, Reference } from 'node-dependency-injection';
import { KeycloakBearerToken } from '@Contexts/Mybandnow/Shared/infrastructure/identityServer/keycloak/KeycloakBearerToken.js';
import { InternalAuthentication } from '@Contexts/Mybandnow/Shared/infrastructure/identityServer/internal/InternalAuthentication.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';

export function registerMybandnowDependencies(container: ContainerBuilder) {
  // Authentication
  container
    .register('Mybandnow.Shared.KeycloakBearerToken', KeycloakBearerToken)
    .addArgument(new Reference('Apps.Mybandnow.Backend.KeyCloakConfig'))
    .addArgument(env.NODE_ENV);

  container
    .register('Mybandnow.Shared.InternalAuthentication', InternalAuthentication)
    .addArgument(Buffer.from(env.KLODING_INTERNAL_PUBLIC_KEY_BASE64, 'base64').toString('utf8'));

  // Repositories

  // Use Cases
}
