import KcAdminClient from '@keycloak/keycloak-admin-client';
import { Nullable } from '../../../domain/Nullable.js';
import KeycloakConfig from './KeycloakConfig.js';

export class KeycloakClientFactory {
  private static clients: Record<string, KcAdminClient> = {};

  static async createClient(contextName: string, config: KeycloakConfig): Promise<KcAdminClient> {
    let client = KeycloakClientFactory.getClient(contextName);

    if (!client) {
      client = await KeycloakClientFactory.createAndConnectClient(config);

      KeycloakClientFactory.registerClient(client, contextName);
    }
    return client;
  }

  private static getClient(contextName: string): Nullable<KcAdminClient> {
    return KeycloakClientFactory.clients[contextName];
  }

  private static async createAndConnectClient(config: KeycloakConfig): Promise<KcAdminClient> {
    const client = new KcAdminClient({
      baseUrl: `${config.origin}`,
      realmName: config.realm
    });
    return client;
  }

  private static registerClient(client: KcAdminClient, contextName: string): void {
    KeycloakClientFactory.clients[contextName] = client;
  }
}
