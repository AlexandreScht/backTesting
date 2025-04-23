import { InvalidCredentialsError, ServicesError } from '@/exceptions';
import type UsersModel from '@/models/users';
import type Database from '@/types/models/Database';
import { logger } from '@/utils/logger';
import { genSalt, hash } from 'bcryptjs';
import { type Transaction } from 'kysely';
import { Service } from 'typedi';
import { v4 as uuid } from 'uuid';

@Service()
export default class AuthServiceFile {
  public async register(
    data: {
      email: string;
      password?: string;
      firstName: string;
      lastName: string;
      phone?: string;
    },
    trx: Transaction<Database>,
  ) {
    try {
      if ('password' in data) {
        const salt = await genSalt(10);
        const hashedPassword = await hash(data.password, salt);
        return await trx
          .insertInto('users')
          .values({ ...data, password: hashedPassword, accessToken: uuid() })
          .returning(['accessToken', 'id'])
          .executeTakeFirstOrThrow();
      } else {
        return await trx
          .insertInto('users')
          .values({ ...data, validate: true })
          .returning(['role', 'id'])
          .executeTakeFirstOrThrow();
      }
    } catch (error) {
      logger.error('AuthServiceFile.register => ', error);
      throw new ServicesError();
    }
  }

  public async login(user: UsersModel, password: string): Promise<boolean> {
    if (await user.checkPassword(password)) {
      return true;
    }
    throw new InvalidCredentialsError('Email ou mot de passe incorrect !');
  }
}
