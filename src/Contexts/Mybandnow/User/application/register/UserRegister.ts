import { EventBus } from '@Contexts/Shared/domain/EventBus.js';
import { User } from '../../domain/User.js';
import { UserId } from '../../domain/value-object/UserId.js';
import { UserEmail } from '../../domain/value-object/UserEmail.js';
import { UserPassword } from '../../domain/value-object/UserPassword.js';
import Logger from '@Contexts/Shared/domain/Logger.js';
import { UserAlreadyExistsException } from '../../domain/exception/UserAlreadyExistsException.js';
import { UserPersistenceRepository } from '../../domain/repository/UserPersistenceRepository.js';
import { PasswordEncryptor } from '../../domain/service/PasswordEncryptor.js';
import { Criteria } from '@Contexts/Shared/domain/criteria/Criteria.js';
import { Filters } from '@Contexts/Shared/domain/criteria/Filters.js';
import { Filter } from '@Contexts/Shared/domain/criteria/Filter.js';
import { FilterField } from '@Contexts/Shared/domain/criteria/FilterField.js';
import { FilterOperator } from '@Contexts/Shared/domain/criteria/FilterOperator.js';
import { FilterValue } from '@Contexts/Shared/domain/criteria/FilterValue.js';
import { Order as CriteriaOrder } from '@Contexts/Shared/domain/criteria/Order.js';

export class UserRegister {
  constructor(
    private readonly logger: Logger,
    private readonly persistenceRepository: UserPersistenceRepository,
    private readonly passwordEncryptor: PasswordEncryptor,
    private readonly eventBus: EventBus
  ) {}

  async run({ id, email, password }: { id: string; email: string; password: string }): Promise<void> {
    const criteria = new Criteria(
      new Filters([new Filter(new FilterField('email'), FilterOperator.equal(), new FilterValue(email))]),
      CriteriaOrder.none()
    );

    const [existingUser] = await this.persistenceRepository.matching(criteria);

    if (existingUser) {
      throw new UserAlreadyExistsException(email);
    }

    const hashedPassword = await this.passwordEncryptor.hash(password);
    const user = User.create(new UserId(id), new UserEmail(email), new UserPassword(hashedPassword));

    this.logger.info({ id: user.id.value }, 'UserRegister:');

    await this.persistenceRepository.save(user);
    await this.eventBus.publish(user.pullDomainEvents());
    this.logger.info(`The user <${id}> has been created`, 'UserRegister:');
  }
}
