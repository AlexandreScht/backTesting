import { InvalidArgumentError, ServerException, ServicesError } from '@/exceptions';
import { type Services } from '@/interfaces/services';
import UsersModel from '@/models/users';
import { type Users, type UsersId } from '@/types/models/public/Users';
import { logger } from '@/utils/logger';
import randomatic from 'randomatic';
import { Service } from 'typedi';
import { v7 as uuid } from 'uuid';
@Service()
export default class UserServiceFile {
  async getUser(props: Services.Users.findProps, fields?: Partial<keyof Users>[]): Promise<Users | null> {
    try {
      if ('email' in props) {
        const { email, oAuthAccount } = props;
        const users = UsersModel.findByEmail(email, oAuthAccount);
        return fields ? await users.select({ ...fields }).executeTakeFirst() : await users.selectAll().executeTakeFirst();
      } else {
        return await UsersModel.findById(props.id as UsersId);
      }
    } catch (error) {
      logger.error('UserServiceFile.getUser => ', error);
      throw new ServicesError();
    }
  }

  async getUserModel(email: string) {
    try {
      return await UsersModel.findLogin(email);
    } catch (error) {
      logger.error('UserServiceFile.getUserModel => ', error);
      throw new ServicesError();
    }
  }
}
