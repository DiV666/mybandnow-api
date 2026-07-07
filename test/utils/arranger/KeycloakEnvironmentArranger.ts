import KcAdminClient, { NetworkError } from '@keycloak/keycloak-admin-client';
import KeycloakConfig from '@Contexts/Shared/infrastructure/identityServer/keycloak/KeycloakConfig.js';
import { KeycloakException } from '@Contexts/Shared/infrastructure/identityServer/keycloak/KeycloakException.js';
import { EnvironmentArranger } from './EnvironmentArranger.js';
import { env } from '@Contexts/Shared/infrastructure/config/env.js';
import { testKeycloakClientId } from '../keycloak/TestKeycloak.js';

export class KeycloakEnvironmentArranger extends EnvironmentArranger {
  constructor(
    private _client: Promise<KcAdminClient>,
    private readonly config: KeycloakConfig
  ) {
    super();
  }

  protected async client(): Promise<KcAdminClient> {
    await this.authenticateClient();
    return this._client;
  }

  private async authenticateClient(): Promise<void> {
    await (
      await this._client
    )
      .auth({
        username: env.KEYCLOAK_ADMIN_USER,
        password: env.KEYCLOAK_ADMIN_PASS,
        grantType: 'password',
        clientId: 'admin-cli'
      })
      .catch(this.handleRequestException);
  }

  public async arrange(): Promise<void> {
    await this.clean();
    await this.addRealm();
    await this.addRealmRoles();
    await this.addUser();
    await this.addClient();
  }

  public async clean(): Promise<void> {
    await (await this.client()).realms.del({ realm: this.config.realm }).catch((ex) => {
      if (ex.responseData?.error !== 'Realm not found.') {
        this.handleRequestException(ex);
      }
    });
  }

  protected async addRealm(): Promise<void> {
    await (
      await this.client()
    ).realms
      .create({
        realm: this.config.realm,
        editUsernameAllowed: true,
        loginWithEmailAllowed: false,
        verifyEmail: true,
        rememberMe: true,
        resetPasswordAllowed: true,
        enabled: true
      })
      .catch(this.handleRequestException);
  }

  protected async addRealmRoles(): Promise<void> {
    const client = await this.client();
    await client.roles
      .create({
        name: 'user:create',
        clientRole: false,
        realm: this.config.realm
      })
      .catch(this.handleRequestException);
    await client.roles
      .create({
        name: 'user:read',
        clientRole: false,
        realm: this.config.realm
      })
      .catch(this.handleRequestException);
    await client.roles
      .create({
        name: 'user:update',
        clientRole: false,
        realm: this.config.realm
      })
      .catch(this.handleRequestException);
    await client.roles
      .create({
        name: 'user:delete',
        clientRole: false,
        realm: this.config.realm
      })
      .catch(this.handleRequestException);

    await client.roles
      .create({
        name: 'admin',
        realm: this.config.realm
      })
      .catch(this.handleRequestException);

    await client.roles
      .create({
        name: 'user',
        realm: this.config.realm
      })
      .catch(this.handleRequestException);

    const adminRole = await client.roles.findOneByName({ name: 'admin', realm: this.config.realm });
    const userRole = await client.roles.findOneByName({ name: 'user', realm: this.config.realm });
    const userCreateRole = await client.roles.findOneByName({ name: 'user:create', realm: this.config.realm });
    const userReadRole = await client.roles.findOneByName({ name: 'user:read', realm: this.config.realm });
    const userUpdateRole = await client.roles.findOneByName({ name: 'user:update', realm: this.config.realm });
    const userDeleteRole = await client.roles.findOneByName({ name: 'user:delete', realm: this.config.realm });

    if (!adminRole?.id || !userCreateRole || !userReadRole || !userUpdateRole || !userDeleteRole) {
      throw new KeycloakException({ details: 'Required roles not found after creation' });
    }

    await client.roles
      .createComposite(
        {
          roleId: adminRole.id,
          realm: this.config.realm
        },
        [userCreateRole, userReadRole, userUpdateRole, userDeleteRole]
      )
      .catch(this.handleRequestException);

    if (!userRole?.id) {
      throw new KeycloakException({ details: 'user role not found after creation' });
    }

    await client.roles
      .createComposite(
        {
          roleId: userRole.id,
          realm: this.config.realm
        },
        [userCreateRole, userReadRole, userUpdateRole]
      )
      .catch(this.handleRequestException);
  }

  protected async addUser(): Promise<void> {
    const client = await this.client();
    const user = await client.users
      .create({
        firstName: 'test',
        lastName: 'test',
        username: 'test',
        email: 'test@example.com',
        emailVerified: true,
        realm: this.config.realm,
        credentials: [{ type: 'password', value: env.TEST_KEYCLOAK_USER_PASSWORD, temporary: false }],
        enabled: true
      })
      .catch(this.handleRequestException);

    const adminRole = await client.roles.findOneByName({ name: 'admin', realm: this.config.realm });
    if (!adminRole?.id || !adminRole?.name) {
      throw new KeycloakException({ details: 'admin role not found after creation' });
    }

    await client.users
      .addRealmRoleMappings({
        id: user.id,
        roles: [
          {
            id: adminRole.id,
            name: adminRole.name
          }
        ],
        realm: this.config.realm
      })
      .catch(this.handleRequestException);
  }

  protected async addClient(): Promise<void> {
    await (
      await this.client()
    ).clients
      .create({
        id: testKeycloakClientId(),
        clientId: testKeycloakClientId(),
        realm: this.config.realm,
        publicClient: true,
        directAccessGrantsEnabled: true,
        enabled: true
      })
      .catch(this.handleRequestException);
  }

  public async close(): Promise<void> {
    // NOT NECESSARY TO KEYCLOAK
  }

  private handleRequestException(ex: NetworkError): never {
    // In test context, we can include response details for debugging.
    // Ensure KeycloakException is configured to mask these details in production HTTP responses.
    throw new KeycloakException({
      details: ex.message || 'Keycloak request failed'
    });
  }
}
