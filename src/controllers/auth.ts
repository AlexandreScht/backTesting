import env from '@/config';
import { user_tester } from '@/config/list';
import { InvalidArgumentError, InvalidCredentialsError, ServerException } from '@/exceptions';
import ApiServiceFile from '@/services/api';
import AuthServiceFile from '@/services/auth';
import MailerServiceFile from '@/services/mailer';
import UserServiceFile from '@/services/users';
import { type authControllerType } from '@/types/controllers/auth';
import { logger } from '@/utils/logger';
import Container from 'typedi';
import ControllerClass from '.';

export default class AuthControllerFile extends ControllerClass {
  private APIService: ApiServiceFile;
  private AuthService: AuthServiceFile;
  private UserService: UserServiceFile;
  private MailerService: MailerServiceFile;

  constructor() {
    super();
    this.APIService = Container.get(ApiServiceFile);
    this.UserService = Container.get(UserServiceFile);
    this.MailerService = Container.get(MailerServiceFile);
    this.AuthService = Container.get(AuthServiceFile);
  }

  protected async register({
    locals: {
      body: { email, password, firstName, lastName, phone },
    },
    res,
    next,
  }: authControllerType.register) {
    try {
      if (new URL(env.ORIGIN).hostname.startsWith('test.') && !user_tester.includes(email)) {
        throw new InvalidCredentialsError('Only developer accounts can have access to this site.');
      }

      const user = await this.UserService.getUser({ email }, ['email']);
      if (!user) {
        await this.MailerService.already_register(email);
        res.status(201).send(true);
        return;
      }

      await this.transactionBuilder(
        trx => this.AuthService.register({ email, password, firstName, lastName, phone }, trx),
        async ({ id, ...returningValues }) => {
          if (!('accessToken' in returningValues) || !id) throw new InvalidArgumentError();
          const { accessToken } = returningValues;
          await this.MailerService.new_register(email, accessToken);
        },
      );
      res.status(201).send(true);
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.register => ', error);
      }
      next(error);
    }
  }

  protected async login({
    locals: {
      body: { email, password },
    },
    res,
    next,
  }: authControllerType.login) {
    try {
      if (new URL(env.ORIGIN).hostname.startsWith('test.') && !user_tester.includes(email)) {
        throw new InvalidCredentialsError('Only developer accounts can have access to this site.');
      }

      const user = await this.UserService.getUserModel(email);

      if (!user) {
        throw new InvalidCredentialsError('Email ou mot de passe incorrect !');
      }

      await this.AuthService.login(user, password);

      res.status(201).send(true);
    } catch (error) {
      if (!(error instanceof ServerException)) {
        logger.error('AuthControllerFile.register => ', error);
      }
      next(error);
    }
  }

  protected async validateAccount({
    locals: {
      params: { accessToken },
    },
    res,
    next,
  }: authControllerType.validAccount) {}
}
