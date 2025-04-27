import { InvalidArgumentError, ServerException, ServicesError } from '@/exceptions';
import { type QueryCriteria, type updatableRows } from '@/interfaces/database';
import { type Services } from '@/interfaces/services';
import UsersModel from '@/models/users';
import type Database from '@/types/models/Database';
import type UsersTable from '@/types/models/public/Users';
import { logger } from '@/utils/logger';
import { type SelectQueryBuilder, type UpdateQueryBuilder } from 'kysely';
import { Service } from 'typedi';
import { v7 as uuid } from 'uuid';
@Service()
export default class UserServiceFile {
  async getUser<K extends keyof UsersTable = keyof UsersTable>(
    props: Services.Users.findProps,
    returnFields?: readonly K[],
  ): Promise<Pick<UsersTable, K> | null> {
    try {
      const query =
        'email' in props
          ? UsersModel.findByEmail(props.email, props.isoAuth)
          : (UsersModel.findById(props.id) as unknown as SelectQueryBuilder<Database, 'users', UsersTable>);

      const row = returnFields ? await query.select(returnFields).executeTakeFirst() : await query.selectAll().executeTakeFirst();

      return row as Pick<UsersTable, K> | null;
    } catch (error) {
      logger.error('UserServiceFile.getUser =>', error);
      throw new ServicesError();
    }
  }

  async getUserModel(email: string) {
    try {
      return await UsersModel.getUser({ email });
    } catch (error) {
      logger.error('UserServiceFile.getUserModel => ', error);
      throw new ServicesError();
    }
  }

  async updateUsers<K extends keyof UsersTable = keyof UsersTable>(
    criteria: QueryCriteria<UsersTable>,
    values: updatableRows<UsersTable>,
    returnFields?: readonly K[],
  ): Promise<Pick<UsersTable, K> | UsersTable | null> {
    try {
      const base = UsersModel.queryModel().update(criteria, values);

      if (returnFields) {
        const builder = base.returning(returnFields) as unknown as UpdateQueryBuilder<Database, 'users', 'users', Pick<UsersTable, K>>;
        const row = await builder.executeTakeFirst();
        return row as Pick<UsersTable, K> | null;
      }

      const builderAll = base.returningAll() as unknown as UpdateQueryBuilder<Database, 'users', 'users', UsersTable>;
      const rowAll = await builderAll.executeTakeFirst();
      return rowAll as UsersTable | null;
    } catch (error) {
      logger.error('UserServiceFile.updateUsers =>', error);
      throw new ServicesError();
    }
  }
}
